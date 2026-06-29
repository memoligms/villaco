import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const villaDescriptionTr =
  "Bodrum Yalıkavak'ta, kapanmaz deniz manzarası ve müstakil özel havuza sahip lüks villa. Villa tamamen size özeldir; kişi başı değil, villanın tamamı kiralanır. 4 yatak odası, 5 double yatak, 4 banyo ve 1 misafir tuvaleti ile geniş gruplar ve aileler için idealdir.\n\nGiriş saati en erken 14:00, çıkış saati en geç 10:00'dir. Erken giriş müsaitliğe bağlı olarak ücretsiz sağlanır. Kahvaltı hizmeti bulunmamaktadır.";

const villaDescriptionEn =
  "A luxury villa in Bodrum Yalıkavak with an unobstructed sea view and a private detached pool. The villa is entirely yours; it is rented as a whole, not per person. With 4 bedrooms, 5 double beds, 4 bathrooms and 1 guest WC, it is ideal for large groups and families.\n\nCheck-in is from 14:00 at the earliest and check-out by 10:00 at the latest. Early check-in is provided free of charge, subject to availability. Breakfast service is not provided.";

const villaDescriptionDe =
  "Eine Luxusvilla in Bodrum Yalıkavak mit unverbautem Meerblick und privatem, freistehendem Pool. Die Villa steht ganz Ihnen zur Verfügung; sie wird als Ganzes vermietet, nicht pro Person. Mit 4 Schlafzimmern, 5 Doppelbetten, 4 Badezimmern und 1 Gäste-WC ist sie ideal für große Gruppen und Familien.\n\nCheck-in ist frühestens ab 14:00 Uhr, Check-out spätestens bis 10:00 Uhr möglich. Ein früher Check-in wird je nach Verfügbarkeit kostenlos angeboten. Es wird kein Frühstücksservice angeboten.";

const villaDescriptionRu =
  "Роскошная вилла в Ялыкаваке, Бодрум, с открытым видом на море и отдельным частным бассейном. Вилла полностью принадлежит вам — она арендуется целиком, а не за человека. 4 спальни, 5 двуспальных кроватей, 4 ванные комнаты и 1 гостевой туалет делают виллу идеальной для больших групп и семей.\n\nЗаезд возможен не ранее 14:00, выезд — не позднее 10:00. Ранний заезд предоставляется бесплатно при наличии возможности. Завтрак не предоставляется.";

async function main() {
  const villaData = {
    name: "Bodrum Luxury Villa, Sea View and Private Pool",
    description: villaDescriptionTr,
    location: "Yalıkavak, Bodrum",
    address: "Geriş Caddesi, 6441 Sokak No:4, Yalıkavak Sitesi, C Blok Villa 1, Yalıkavak / Bodrum",
    maxGuest: 10,
    baseNightlyPrice: 1200,
    cleaningFee: 0,
    depositFee: 0,
    images: Array.from({ length: 49 }, (_, i) => `/villa/villa-${String(i + 1).padStart(2, "0")}.jpg`),
    amenities: [
      "Tüm villa size özel (kişi başı değil)",
      "Kapanmaz deniz manzarası",
      "Müstakil özel havuz",
      "4 yatak odası",
      "5 double (çift kişilik) yatak",
      "4 banyo + 1 misafir tuvaleti",
      "Tam donanımlı mutfak",
      "Wi-Fi",
      "Klima",
      "Ücretsiz otopark",
      "Giriş 14:00 / Çıkış 10:00",
      "Erken giriş (müsaitliğe bağlı, ücretsiz)",
    ],
    translations: {
      en: {
        name: "Bodrum Luxury Villa, Sea View and Private Pool",
        description: villaDescriptionEn,
        location: "Yalıkavak, Bodrum",
        address: "Geriş Caddesi, 6441 Sokak No:4, Yalıkavak Sitesi, Block C, Villa 1, Yalıkavak / Bodrum",
        amenities: [
          "The entire villa is yours (not per person)",
          "Unobstructed sea view",
          "Private detached pool",
          "4 bedrooms",
          "5 double beds",
          "4 bathrooms + 1 guest WC",
          "Fully equipped kitchen",
          "Wi-Fi",
          "Air conditioning",
          "Free parking",
          "Check-in 14:00 / Check-out 10:00",
          "Early check-in (subject to availability, free of charge)",
        ],
      },
      de: {
        name: "Bodrum Luxury Villa, Sea View and Private Pool",
        description: villaDescriptionDe,
        location: "Yalıkavak, Bodrum",
        address: "Geriş Caddesi, 6441 Sokak Nr. 4, Yalıkavak Sitesi, Block C, Villa 1, Yalıkavak / Bodrum",
        amenities: [
          "Die ganze Villa gehört Ihnen (nicht pro Person)",
          "Unverbauter Meerblick",
          "Privater freistehender Pool",
          "4 Schlafzimmer",
          "5 Doppelbetten",
          "4 Badezimmer + 1 Gäste-WC",
          "Voll ausgestattete Küche",
          "WLAN",
          "Klimaanlage",
          "Kostenloses Parken",
          "Check-in 14:00 / Check-out 10:00",
          "Früher Check-in (je nach Verfügbarkeit, kostenlos)",
        ],
      },
      ru: {
        name: "Bodrum Luxury Villa, Sea View and Private Pool",
        description: villaDescriptionRu,
        location: "Ялыкавак, Бодрум",
        address: "Geriş Caddesi, 6441 Sokak No:4, Yalıkavak Sitesi, блок C, вилла 1, Ялыкавак / Бодрум",
        amenities: [
          "Вся вилла принадлежит только вам (не за человека)",
          "Открытый вид на море",
          "Отдельный частный бассейн",
          "4 спальни",
          "5 двуспальных кроватей",
          "4 ванные комнаты + 1 гостевой туалет",
          "Полностью оборудованная кухня",
          "Wi-Fi",
          "Кондиционер",
          "Бесплатная парковка",
          "Заезд 14:00 / Выезд 10:00",
          "Ранний заезд (при наличии возможности, бесплатно)",
        ],
      },
    },
  };

  await prisma.villa.upsert({
    where: { slug: "yalikavak-villa" },
    update: villaData,
    create: { ...villaData, slug: "yalikavak-villa" },
  });

  // Güncel ek hizmetler (USD) + çeviriler.
  const desiredExtras = [
    {
      name: "Ekstra Temizlik",
      description: "Konaklama sırasında talep edilen ilave temizlik hizmeti.",
      price: 150,
      translations: {
        en: { name: "Extra Cleaning", description: "Additional cleaning service requested during your stay." },
        de: { name: "Extra-Reinigung", description: "Zusätzlicher Reinigungsservice, der während Ihres Aufenthalts angefordert wird." },
        ru: { name: "Дополнительная уборка", description: "Дополнительная уборка по запросу во время проживания." },
      },
    },
    {
      name: "Havalimanı Transfer (Gidiş-Dönüş)",
      description: "Milas-Bodrum Havalimanı - villa arası gidiş-dönüş özel transfer.",
      price: 200,
      translations: {
        en: { name: "Airport Transfer (Round Trip)", description: "Private round-trip transfer between Milas-Bodrum Airport and the villa." },
        de: { name: "Flughafentransfer (Hin- und Rückfahrt)", description: "Privater Hin- und Rücktransfer zwischen dem Flughafen Milas-Bodrum und der Villa." },
        ru: { name: "Трансфер из аэропорта (туда и обратно)", description: "Частный трансфер в обе стороны между аэропортом Милас-Бодрум и виллой." },
      },
    },
    {
      name: "6 Saat Şöförlü VIP Van",
      description: "6 saat tahsisli, şöförlü VIP Van hizmeti.",
      price: 250,
      translations: {
        en: { name: "6-Hour Chauffeured VIP Van", description: "6 hours of dedicated, chauffeured VIP Van service." },
        de: { name: "6 Stunden chauffierter VIP-Van", description: "6 Stunden exklusiver, chauffierter VIP-Van-Service." },
        ru: { name: "VIP-вэн с водителем на 6 часов", description: "6 часов индивидуального обслуживания VIP-вэном с водителем." },
      },
    },
    {
      name: "8 Saat Şöförlü VIP Van",
      description: "8 saat tahsisli, şöförlü VIP Van hizmeti.",
      price: 300,
      translations: {
        en: { name: "8-Hour Chauffeured VIP Van", description: "8 hours of dedicated, chauffeured VIP Van service." },
        de: { name: "8 Stunden chauffierter VIP-Van", description: "8 Stunden exklusiver, chauffierter VIP-Van-Service." },
        ru: { name: "VIP-вэн с водителем на 8 часов", description: "8 часов индивидуального обслуживания VIP-вэном с водителем." },
      },
    },
    {
      name: "Günlük Tekne Turu",
      description: "11:00-17:00 arası, öğle yemeği ve soft içecekler dahil, 6 kişilik özel tekne turu.",
      price: 1250,
      translations: {
        en: { name: "Daily Boat Trip", description: "Private boat trip for 6 people, 11:00-17:00, including lunch and soft drinks." },
        de: { name: "Tägliche Bootstour", description: "Private Bootstour für 6 Personen, 11:00-17:00 Uhr, inklusive Mittagessen und Softdrinks." },
        ru: { name: "Ежедневная морская прогулка", description: "Частная прогулка на лодке для 6 человек, 11:00-17:00, включая обед и безалкогольные напитки." },
      },
    },
  ];

  // Listede olmayan eski hizmetleri pasifleştir
  await prisma.extraService.updateMany({
    where: { name: { notIn: desiredExtras.map((e) => e.name) } },
    data: { isActive: false },
  });

  for (const service of desiredExtras) {
    const existing = await prisma.extraService.findFirst({ where: { name: service.name } });
    if (existing) {
      await prisma.extraService.update({
        where: { id: existing.id },
        data: { ...service, isActive: true },
      });
    } else {
      await prisma.extraService.create({ data: { ...service, isActive: true } });
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
