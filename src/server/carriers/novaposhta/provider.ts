import {
  CarrierNotImplementedError,
  type CalculateShipmentInput,
  type CalculateShipmentResult,
  type CarrierCity,
  type CarrierCounterparty,
  type CarrierProvider,
  type CarrierSettlement,
  type CarrierStreet,
  type CarrierWarehouse,
  type CreateShipmentInput,
  type PrintDocumentsInput,
  type PrintDocumentsResult,
  type ShipmentResult,
  type TrackShipmentResult,
} from "../carrier.interface";
import { callNovaPoshta } from "./client";
import { NP_METHOD, NP_MODEL } from "./endpoints";
import {
  formatNpDate,
  mapCity,
  mapContactPerson,
  mapCounterparty,
  mapPackItem,
  mapShipmentResult,
  mapStreet,
  mapWarehouse,
  toNpPhone,
  type NovaPoshtaContactPerson,
  type NovaPoshtaPackItem,
} from "./mapper";
import type {
  NpCityRaw,
  NpContactPersonRaw,
  NpCounterpartyRaw,
  NpDeleteDocumentRaw,
  NpDocumentPriceRaw,
  NpPackItemRaw,
  NpSaveDocumentRaw,
  NpStreetRaw,
  NpTrackingStatusRaw,
  NpWarehouseRaw,
  NpWarehouseTypeRaw,
} from "./types";

const CARRIER_KEY = "nova_poshta";
const MY_NP_URL = "https://my.novaposhta.ua";
// Назви базових типів точки видачі в довіднику Address.getWarehouseTypes —
// партнерські варіанти (Поштомат Приватбанку, Поштомат InPost) свідомо не
// охоплюємо цим проходом (документовано, orders-new-order-form.md, "Відкрито").
const POSTOMAT_WAREHOUSE_TYPE_NAME = "Поштомат";
const REGULAR_WAREHOUSE_TYPE_NAME = "Поштове(ий)";

// Кеш довідника типів точок видачі (module-level, по apiKey) — четвертий
// прохід: без кешу кожен пошук у комбобоксі відділення/поштомата (debounce
// 300мс у NpSearchCombobox) робив зайвий виклик getWarehouseTypes і живо
// впирався в rate-limit НП ("To many requests", перевірено live-тестом).
// Реальний Ref типу не змінюється практично ніколи — TTL великий, не cron.
const WAREHOUSE_TYPES_CACHE = new Map<string, { types: NpWarehouseTypeRaw[]; expiresAt: number }>();
const WAREHOUSE_TYPES_TTL_MS = 60 * 60 * 1000;

/**
 * Уся специфіка Нової пошти живе тут — CRM ніколи не бачить modelName/
 * calledMethod/поля відповіді напряму (пряма архітектурна вимога людини).
 * ✅-методи нижче перевірені живим викликом цієї сесії
 * (docs/carriers/novaposhta/reference-data.md); методи, що кидають
 * CarrierNotImplementedError, задокументовані в docs/carriers/novaposhta/,
 * але вимагають ручної звірки з офіційним API перед реалізацією (реальний
 * побічний ефект — створення/скасування справжнього відправлення).
 */
export class NovaPoshtaProvider implements CarrierProvider {
  constructor(private readonly apiKey: string) {}

  /** Не частина CarrierProvider — той самий виклик, що testDeliveryApiKeyAction. */
  async testConnection(): Promise<void> {
    await this.getCities("Київ");
  }

  // ✅ docs/carriers/novaposhta/reference-data.md
  async getCities(query: string): Promise<CarrierCity[]> {
    const rows = await callNovaPoshta<NpCityRaw>(this.apiKey, NP_MODEL.address, NP_METHOD.getCities, {
      FindByString: query,
      Limit: "20",
    });
    return rows.map(mapCity);
  }

  // ✅ docs/carriers/novaposhta/reference-data.md
  // Четвертий прохід (баг-фікс, людина: "коли обираю поштомати їх немає у
  // списку, а вони є у списку відділень") — раніше "warehouse" не фільтрував
  // ЗОВСІМ (undefined → API повертає точки видачі всіх типів упереміш).
  // Тепер фільтруємо ЗАВЖДИ обома типами.
  async getWarehouses(cityRef: string, query: string, kind: "warehouse" | "postomat" = "warehouse"): Promise<CarrierWarehouse[]> {
    const typeName = kind === "postomat" ? POSTOMAT_WAREHOUSE_TYPE_NAME : REGULAR_WAREHOUSE_TYPE_NAME;
    const typeOfWarehouseRef = await this.getWarehouseTypeRef(typeName);
    const rows = await callNovaPoshta<NpWarehouseRaw>(this.apiKey, NP_MODEL.address, NP_METHOD.getWarehouses, {
      CityRef: cityRef,
      FindByString: query,
      Limit: "20",
      ...(typeOfWarehouseRef ? { TypeOfWarehouseRef: typeOfWarehouseRef } : {}),
    });
    return rows.map(mapWarehouse);
  }

  // ✅ реалізовано третім проходом (Поштомат як реальний тип доставки) —
  // Address.getWarehouseTypes, той самий MODEL, що getWarehouses/getCities.
  // Не частина CarrierProvider (не всі перевізники моделюють типи точок так само).
  // Четвертий прохід — закешовано (WAREHOUSE_TYPES_CACHE), інакше кожен
  // пошук у пошуковому комбобоксі робить зайвий виклик і б'є в rate-limit.
  async getWarehouseTypes(): Promise<NpWarehouseTypeRaw[]> {
    const cached = WAREHOUSE_TYPES_CACHE.get(this.apiKey);
    if (cached && cached.expiresAt > Date.now()) return cached.types;
    const types = await callNovaPoshta<NpWarehouseTypeRaw>(this.apiKey, NP_MODEL.address, NP_METHOD.getWarehouseTypes, {});
    WAREHOUSE_TYPES_CACHE.set(this.apiKey, { types, expiresAt: Date.now() + WAREHOUSE_TYPES_TTL_MS });
    return types;
  }

  /** Живий пошук Ref типу точки видачі за назвою — не хардкодимо здогадані GUID (§9.8 CLAUDE.md). */
  private async getWarehouseTypeRef(name: string): Promise<string | undefined> {
    const types = await this.getWarehouseTypes();
    return types.find((t) => t.Description === name)?.Ref;
  }

  // ✅ docs/carriers/novaposhta/reference-data.md
  async getCounterparties(): Promise<CarrierCounterparty[]> {
    const rows = await callNovaPoshta<NpCounterpartyRaw>(
      this.apiKey,
      NP_MODEL.counterparty,
      NP_METHOD.getCounterparties,
      { CounterpartyProperty: "Sender", Page: "1" }
    );
    return rows.map(mapCounterparty);
  }

  /** Не частина CarrierProvider (не всі перевізники моделюють контактну особу окремо) — ✅ перевірено живим викликом. */
  async getContactPersons(counterpartyRef: string): Promise<NovaPoshtaContactPerson[]> {
    const rows = await callNovaPoshta<NpContactPersonRaw>(
      this.apiKey,
      NP_MODEL.counterparty,
      NP_METHOD.getCounterpartyContactPersons,
      { Ref: counterpartyRef, Page: "1" }
    );
    return rows.map(mapContactPerson);
  }

  /** Не частина CarrierProvider — ✅ перевірено живим викликом. */
  async getPackList(): Promise<NovaPoshtaPackItem[]> {
    const rows = await callNovaPoshta<NpPackItemRaw>(this.apiKey, NP_MODEL.commonGeneral, NP_METHOD.getPackList, {});
    return rows.map(mapPackItem);
  }

  // ✅ docs/carriers/novaposhta/shipments.md — getDocumentPrice, реалізовано
  // за прямою вказівкою людини (orders-new-order-form.md, редизайн, кнопка
  // «Розрахувати вартість доставки»). Документовано як безпечне для живого
  // тесту — чисте обчислення без побічного ефекту (на відміну від save/
  // createShipment).
  async calculate(input: CalculateShipmentInput): Promise<CalculateShipmentResult> {
    const [row] = await callNovaPoshta<NpDocumentPriceRaw>(
      this.apiKey,
      NP_MODEL.internetDocument,
      NP_METHOD.getDocumentPrice,
      {
        CitySender: input.cityFromRef,
        CityRecipient: input.cityToRef,
        Weight: String(input.weightKg),
        ServiceType: input.serviceType,
        Cost: String(input.declaredValue),
        CargoType: input.cargoType,
        SeatsAmount: String(input.seatsAmount),
        // Пакування — PackRef, ОКРЕМЕ top-level поле (shipments.md, "PackRef —
        // опційно, Ref з CommonGeneral.getPackList"), НЕ вкладене в OptionsSeat
        // (те інше поле — про об'ємну вагу/габарити, "OptionsSeat is empty or
        // one of option is empty" — реальна помилка живого тесту, коли раніше
        // сюди помилково передавався packRef замість PackRef).
        ...(input.packRef ? { PackRef: input.packRef } : {}),
      }
    );
    return {
      cost: Number(row.Cost),
      costRedelivery: row.CostRedelivery ? Number(row.CostRedelivery) : null,
    };
  }

  // ✅ docs/carriers/novaposhta/shipments.md — реалізовано за прямою вказівкою
  // людини (орденр-форма /orders/new вимагала справжнього створення ЕН, не
  // заглушки). Поля звірені між трьома незалежними типізованими клієнтами
  // (business-mapping.md), АЛЕ сам виклик — реальний побічний ефект
  // (створює справжнє відправлення на акаунті тенанта), тому перший живий
  // виклик мусить пройти під наглядом людини (не тестували наосліп).
  // Відправник — завжди `kind: "counterparty"` (з налаштувань способу
  // доставки). Отримувач — `kind: "new_recipient"`: конкретна людина, якої
  // ще нема серед контрагентів акаунта перевізника — НП сама створює
  // контрагента-отримувача з полів RecipientName/RecipientType/NewAddress=1
  // (SaveWarehouse-варіант, shipments.md).
  async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    if (input.sender.kind !== "counterparty") {
      throw new Error("Відправник повинен бути обраним контрагентом акаунта Нової пошти");
    }
    const { sender, recipient } = input;

    const methodProperties: Record<string, unknown> = {
      PayerType: input.payerType,
      PaymentMethod: input.paymentMethod,
      DateTime: formatNpDate(new Date()),
      ServiceType: input.serviceType,
      CargoType: input.cargoType,
      Weight: String(input.weightKg),
      SeatsAmount: String(input.seatsAmount),
      // Description — офіційний ліміт НП: string[36] (звірено людиною з
      // developers.novaposhta.ua). Довший текст НП мовчки ігнорує все поле
      // замість обрізання. AdditionalInformation — ОКРЕМЕ поле (та сама
      // звірка, приклад із документації: "AdditionalInformation": "Смартфон")
      // — це те, що реально показується як «Додаткова інформація про
      // відправлення» в кабінеті НП (саме там людина шукала опис і не
      // бачила його) — без задокументованого ліміту, надсилаємо повний текст.
      Description: input.description.slice(0, 36),
      AdditionalInformation: input.description,
      Cost: String(input.declaredValue),
      CitySender: sender.cityRef,
      Sender: sender.counterpartyRef,
      SenderAddress: sender.warehouseRef,
      ContactSender: sender.contactPersonRef,
      SendersPhone: toNpPhone(sender.phone),
      // Накладений платіж — реальний BackwardDeliveryData (четвертий прохід,
      // раніше codAmount рахувався лише для показу, не надсилався в НП —
      // жива вказівка людини: "післяплата обрана, а грошовий переказ не
      // додається"). PayerType того самого відправника — хто платить за
      // послугу переказу (окремого налаштування "хто платить за переказ"
      // немає, свідомо перевикористано те саме поле, що для доставки).
      ...(input.codAmount && input.codAmount > 0
        ? {
            BackwardDeliveryData: [
              {
                PayerType: input.payerType,
                CargoType: "Money",
                RedeliveryString: String(input.codAmount),
              },
            ],
          }
        : {}),
      // OptionsSeat — обов'язкове поле НП для поштоматів ("OptionsSeat is
      // empty", реальна помилка живого тесту, підтверджений форумом баг НП,
      // shipments.md); безпечно надсилати завжди (не лише для поштомата) —
      // один запис на місце (SeatsAmount).
      OptionsSeat: Array.from({ length: Math.max(1, input.seatsAmount) }, () => ({
        weight: String(input.weightKg),
        volumetricWidth: String(input.packageWidthCm ?? 0),
        volumetricLength: String(input.packageLengthCm ?? 0),
        volumetricHeight: String(input.packageHeightCm ?? 0),
      })),
    };

    if (recipient.kind === "counterparty") {
      Object.assign(methodProperties, {
        CityRecipient: recipient.cityRef,
        Recipient: recipient.counterpartyRef,
        RecipientAddress: recipient.warehouseRef,
        ContactRecipient: recipient.contactPersonRef,
        RecipientsPhone: toNpPhone(recipient.phone),
      });
    } else {
      // Новий отримувач — без Ref контрагента/контактної особи (shipments.md, "SaveWarehouse").
      Object.assign(methodProperties, {
        CityRecipient: recipient.cityRef,
        RecipientCityName: recipient.cityName,
        Recipient: "",
        ContactRecipient: "",
        RecipientsPhone: toNpPhone(recipient.phone),
        RecipientName: recipient.fullName,
        RecipientType: "PrivatePerson",
        NewAddress: "1",
        // Відділення/поштомат — RecipientAddress = Ref точки видачі (як і
        // раніше). Доставка "до дверей" (Адреса, третій прохід) — інша пара
        // полів (RecipientAddressName+BuildingNumber). Ця гілка (Doors) НЕ
        // перевірена живим викликом — перший реальний виклик під наглядом
        // людини (той самий принцип, що createShipment загалом, shipments.md).
        ...(recipient.warehouseRef
          ? { RecipientAddress: recipient.warehouseRef }
          : { RecipientAddressName: recipient.streetRef, BuildingNumber: recipient.houseNumber }),
      });
    }

    const [row] = await callNovaPoshta<NpSaveDocumentRaw>(
      this.apiKey,
      NP_MODEL.internetDocument,
      NP_METHOD.save,
      methodProperties
    );
    return mapShipmentResult(row);
  }

  // ⚠️ docs/carriers/novaposhta/shipments.md
  async updateShipment(): Promise<ShipmentResult> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "updateShipment");
  }

  // ✅ docs/carriers/novaposhta/shipments.md — реалізовано четвертим проходом
  // за прямою вказівкою людини («Додай кнопку Видалити ЕН»). Реальний
  // побічний ефект (скасовує справжнє відправлення на акаунті тенанта) —
  // той самий рівень довіри, що createShipment.
  async deleteShipment(ref: string): Promise<void> {
    await callNovaPoshta<NpDeleteDocumentRaw>(this.apiKey, NP_MODEL.internetDocument, NP_METHOD.delete, {
      DocumentRefs: [ref],
    });
  }

  // ✅ docs/carriers/novaposhta/tracking-returns-redirects.md — реалізовано
  // четвертим проходом («показувати статус ЕН у Новій пошті»). Read-only,
  // безпечно для живого виклику. Ключ API не обов'язковий за документованою
  // поведінкою, але передаємо для єдності з рештою методів.
  async track(documentNumber: string, phone?: string): Promise<TrackShipmentResult> {
    const [row] = await callNovaPoshta<NpTrackingStatusRaw>(
      this.apiKey,
      NP_MODEL.trackingDocument,
      NP_METHOD.getStatusDocuments,
      { Documents: [{ DocumentNumber: documentNumber, ...(phone ? { Phone: phone } : {}) }] }
    );
    return {
      documentNumber: row.Number,
      statusCode: row.StatusCode,
      status: row.Status,
      scheduledDeliveryDate: row.ScheduledDeliveryDate || null,
    };
  }

  // ⚠️ docs/carriers/novaposhta/tracking-returns-redirects.md — точний метод AdditionalService потребує звірки
  async createReturn(): Promise<{ ref: string }> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "createReturn");
  }

  // ⚠️ docs/carriers/novaposhta/tracking-returns-redirects.md
  async redirectShipment(): Promise<{ ref: string }> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "redirectShipment");
  }

  // ✅ docs/carriers/novaposhta/reference-data.md — реальний метод "getStreet"
  // (однина!), не "getStreets" — та сама гочка, що з Reference/CommonGeneral.
  async getStreets(cityRef: string, query: string): Promise<CarrierStreet[]> {
    const rows = await callNovaPoshta<NpStreetRaw>(this.apiKey, NP_MODEL.address, NP_METHOD.getStreet, {
      CityRef: cityRef,
      FindByString: query,
      Limit: "20",
    });
    return rows.map(mapStreet);
  }

  // ⚠️ не просили ще — Address.searchSettlements
  async getSettlement(): Promise<CarrierSettlement[]> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "getSettlement");
  }

  // ✅ docs/carriers/novaposhta/printing.md — реалізовано третім проходом за
  // прямою вказівкою людини. НЕ JSON-RPC-виклик (callNovaPoshta тут не
  // задіяний) — просто формує URL на my.novaposhta.ua за схемою, підтвердженою
  // незалежним відкритим SDK (офіційний портал 403 для бота, printing.md).
  // Перший живий друк варто перевірити з людиною.
  async printDocuments(input: PrintDocumentsInput): Promise<PrintDocumentsResult> {
    const method = input.kind === "marking" ? "printMarking100x100" : "printDocument";
    const refs = input.documentRefs.join(",");
    const format = input.format ?? "pdf";
    return { url: `${MY_NP_URL}/orders/${method}/orders[]/${refs}/type/${format}/apiKey/${this.apiKey}` };
  }
}
