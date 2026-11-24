import "dotenv/config";
import sharp from "sharp";
import { mkdir, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import { defaultSettings } from "../src/lib/types";
import { storagePath } from "../src/lib/storage";
import { runFfmpeg } from "../worker/media";

const directory = path.resolve(".local/demo-input");
const refresh = process.argv.includes("--refresh-demo");
function productSvg(width: number, height: number, theme = "lilac") {
  const themes: Record<string, string[]> = { lilac: ["#ded5e8", "#ad9ac7", "#8b779d", "#f4e5ee", "#b698ba", "LUEUR", "EAU DE PARFUM"], olive: ["#d9e0c9", "#a2b29a", "#6d8476", "#f2eadd", "#7b997d", "ritual", "DAILY ESSENTIALS"], amber: ["#efd9bc", "#c2a080", "#99776a", "#f8e9cf", "#b47b4e", "SOLA", "GOLDEN COLLECTION"] };
  const [light, mid, dark, label, bottle, name, subtitle] = themes[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1000 1500" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".65" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="glass"><stop stop-color="#ffffffb3"/><stop offset=".13" stop-color="${bottle}"/><stop offset=".45" stop-color="#ffffff66"/><stop offset=".83" stop-color="${bottle}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="plinth"><stop stop-color="${mid}"/><stop offset=".4" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="cap"><stop stop-color="${dark}"/><stop offset=".5" stop-color="${bottle}"/><stop offset=".7" stop-color="${label}"/><stop offset="1" stop-color="${dark}"/></linearGradient><filter id="shadow"><feGaussianBlur stdDeviation="20"/></filter></defs><rect width="1000" height="1500" fill="url(#bg)"/><circle cx="330" cy="390" r="420" fill="${label}" opacity=".25"/><path d="M-100 1200Q430 1120 1200 1430L1200 1600H-100Z" fill="${dark}" opacity=".38"/><ellipse cx="550" cy="1185" rx="310" ry="62" fill="#3c2842" opacity=".18" filter="url(#shadow)"/><g transform="rotate(-7 500 800)"><path d="M180 1030v155c0 70 650 70 650 0v-155" fill="url(#plinth)"/><ellipse cx="505" cy="1030" rx="325" ry="75" fill="${light}"/><g transform="translate(340 420)"><rect x="70" width="210" height="120" rx="7" fill="url(#cap)"/><rect x="117" y="116" width="116" height="65" fill="url(#cap)"/><rect x="8" y="174" width="340" height="430" rx="38" fill="url(#glass)" stroke="${label}" stroke-opacity=".6" stroke-width="5"/><rect x="44" y="325" width="265" height="155" fill="${label}" fill-opacity=".8" stroke="#fff5"/><text x="176" y="395" text-anchor="middle" font-family="Arial,sans-serif" font-size="35" letter-spacing="5" fill="${dark}">${name}</text><text x="176" y="437" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" letter-spacing="2" fill="${dark}">${subtitle}</text><path d="M31 210v340" stroke="#fff" stroke-opacity=".35" stroke-width="7" stroke-linecap="round"/></g></g><path d="M950 250Q700 450 875 560Q1040 420 1050 170Z" fill="${dark}" opacity=".27"/></svg>`;
}
function landscapeSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1200" viewBox="0 0 1800 1200"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#aba8c9"/><stop offset=".6" stop-color="#ded0df"/><stop offset="1" stop-color="#e4bdb0"/></linearGradient><linearGradient id="hill" x2="1" y2="1"><stop stop-color="#8c86a9"/><stop offset="1" stop-color="#aaa0b8"/></linearGradient></defs><rect width="1800" height="1200" fill="url(#sky)"/><circle cx="1270" cy="300" r="145" fill="#ffe6cd"/><path d="M-100 970Q450 580 1100 830T1950 970V1300H-100Z" fill="url(#hill)"/><path d="M-100 1200Q500 1050 930 930T1950 1020V1300H-100Z" fill="#706b8a"/><path d="M-100 1270Q400 1200 1000 1160T1900 1120V1300H-100Z" fill="#625f7c" opacity=".45"/></svg>`;
}
function backstageSvg(width: number, height: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1000 1400" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#332a40"/><stop offset=".65" stop-color="#88758e"/><stop offset="1" stop-color="#c5b1bb"/></linearGradient><linearGradient id="soft"><stop stop-color="#faf6f5"/><stop offset="1" stop-color="#a49aac"/></linearGradient><radialGradient id="light"><stop stop-color="#edc8d4" stop-opacity=".5"/><stop offset="1" stop-color="#edc8d4" stop-opacity="0"/></radialGradient></defs><rect width="1000" height="1400" fill="url(#bg)"/><ellipse cx="950" cy="250" rx="720" ry="700" fill="url(#light)"/><g transform="rotate(-12 150 400)"><path d="M-70 230L280 200 390 440 50 540-90 410Z" fill="url(#soft)" stroke="#2c2335" stroke-width="16"/><path d="M120 495L150 1450" stroke="#2e2535" stroke-width="18"/></g><ellipse cx="810" cy="970" rx="360" ry="90" fill="#665064"/><path d="M450 918v70c0 95 720 95 720 0v-70" fill="#73566e"/><ellipse cx="810" cy="915" rx="360" ry="90" fill="#d8b9c4"/><rect x="740" y="670" width="110" height="180" rx="16" fill="#d7b7cc" stroke="#efdfed" stroke-width="4"/><rect x="764" y="630" width="62" height="43" rx="4" fill="#6b4b67"/><g transform="rotate(8 320 820)"><rect x="190" y="685" width="235" height="160" rx="14" fill="#302738" stroke="#64516c" stroke-width="5"/><rect x="425" y="724" width="100" height="96" rx="10" fill="#3d304a" stroke="#695673" stroke-width="5"/><path d="M310 846L265 1430M325 846L420 1430" stroke="#2c2232" stroke-width="15"/><rect x="219" y="657" width="74" height="30" rx="4" fill="#3d304a"/></g></svg>`;
}
async function image(name: string, svg: string) {
  const filename = path.join(directory, name);
  await sharp(Buffer.from(svg)).jpeg({ quality: 96 }).toFile(filename);
  return filename;
}
async function movingPoster(name: string, poster: string) {
  const filename = path.join(directory, name);
  await runFfmpeg(["-loop", "1", "-i", poster, "-vf", "zoompan=z='min(zoom+0.00025,1.035)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=150:s=720x1280:fps=25", "-t", "6", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", filename]);
  return filename;
}
async function register(id: string, filename: string, mime: string) {
  const existing = await db.media.findUnique({ where: { id } });
  if (existing && !refresh) return;
  const version = (existing?.version || 0) + 1;
  const sourceKey = `sources/demo/${id}/v${version}/${path.basename(filename)}`;
  const target = storagePath(sourceKey);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(filename, target);
  const fields = { originalName: path.basename(filename), sourceKey, mime, bytes: BigInt((await stat(filename)).size), status: "QUEUED" as const, version, jobs: { create: { type: "PROCESS_MEDIA" as const, revision: version } } };
  await db.media.upsert({ where: { id }, create: { id, ...fields }, update: fields });
}
async function main() {
  if (process.env.STORAGE_DRIVER === "blob") throw new Error("Demo seed runs only with local storage. Add your real work through the admin on production.");
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error("Set ADMIN_EMAIL and a password of at least 12 characters in .env.");
  await db.user.upsert({ where: { email: email.toLowerCase() }, create: { email: email.toLowerCase(), name: "Portfolio Owner", passwordHash: hashPassword(password) }, update: {} });
  await mkdir(directory, { recursive: true });
  if (refresh || !await db.media.count({ where: { id: "demo-lilac-wide" } })) {
    const lilac = await image("lilac-portrait.jpg", productSvg(1080, 1920));
    const olive = await image("olive-portrait.jpg", productSvg(1080, 1920, "olive"));
    const amber = await image("amber-portrait.jpg", productSvg(1080, 1920, "amber"));
    await register("demo-lilac-wide", await image("lilac-wide.jpg", productSvg(1800, 1200)), "image/jpeg");
    await register("demo-olive", olive, "image/jpeg");
    await register("demo-amber", await image("amber-square.jpg", productSvg(1400, 1400, "amber")), "image/jpeg");
    await register("demo-landscape", await image("landscape.jpg", landscapeSvg()), "image/jpeg");
    await register("demo-lilac-tall", lilac, "image/jpeg");
    const bts = await image("studio-portrait.jpg", backstageSvg(1080, 1920));
    await register("demo-bts-photo", await image("studio-wide.jpg", backstageSvg(1600, 1200)), "image/jpeg");
    await register("demo-film-lilac", await movingPoster("lueur-film.mp4", lilac), "video/mp4");
    await register("demo-film-olive", await movingPoster("ritual-film.mp4", olive), "video/mp4");
    await register("demo-film-amber", await movingPoster("golden-film.mp4", amber), "video/mp4");
    await register("demo-bts-video", await movingPoster("studio-diary.mp4", bts), "video/mp4");
  }
  const entries = [
    { id: "demo-project-lueur", slug: "lueur-cham-anh-sang", title: "Lueur — Chạm ánh sáng", type: "VIDEO" as const, cover: "demo-film-lilac", main: ["demo-film-lilac"], tag: "Product film", role: "Quay phim · Ánh sáng · Hậu kỳ" },
    { id: "demo-project-ritual", slug: "everyday-ritual", title: "Everyday Ritual", type: "VIDEO" as const, cover: "demo-film-olive", main: ["demo-film-olive"], tag: "Skincare", role: "Concept · Quay phim · Chỉnh màu" },
    { id: "demo-project-golden", slug: "golden-hour", title: "Golden Hour", type: "VIDEO" as const, cover: "demo-film-amber", main: ["demo-film-amber"], tag: "Product story", role: "Quay phim · Dựng · Sound design" },
    { id: "demo-project-photo", slug: "hinh-va-khoang-trong", title: "Hình & khoảng trống", type: "PHOTO" as const, cover: "demo-lilac-wide", main: ["demo-lilac-wide", "demo-olive", "demo-amber", "demo-landscape", "demo-lilac-tall"], tag: "Product photography", role: "Nhiếp ảnh · Ánh sáng · Hậu kỳ" },
    { id: "demo-project-sky", slug: "mot-khoang-troi", title: "Một khoảng trời", type: "PHOTO" as const, cover: "demo-landscape", main: ["demo-landscape", "demo-lilac-wide", "demo-amber"], tag: "Editorial", role: "Nhiếp ảnh · Chỉnh màu" },
  ];
  for (const [order, entry] of entries.entries()) {
    if (await db.project.findUnique({ where: { id: entry.id } })) continue;
    await db.project.create({ data: {
      id: entry.id, slug: entry.slug, title: entry.title, type: entry.type, role: entry.role,
      summary: entry.type === "VIDEO" ? "Một nghiên cứu thị giác về ánh sáng, bề mặt và cảm xúc trong phim sản phẩm. Nội dung mẫu để trải nghiệm portfolio." : "Một bộ ảnh khám phá hình khối, chất liệu và những khoảng sáng. Mỗi khung hình là một góc nhìn trong cùng câu chuyện.",
      concept: "Khai thác sự tương phản giữa ánh sáng mềm và những đường nét của sản phẩm. Chuyển động tiết chế và bố cục thoáng để chất liệu trở thành nhân vật chính.",
      scope: entry.type === "VIDEO" ? "Phát triển hướng hình ảnh, setup ánh sáng, quay cận cảnh và hoàn thiện màu sắc. Đây là đoạn phim minh họa được dựng từ hình khối, có thể thay bằng tác phẩm thật trong quản trị." : "Lên hướng hình ảnh, sắp đặt sản phẩm, bố trí ánh sáng, chụp ảnh và hoàn thiện màu sắc. Các ảnh minh họa thể hiện tỉ lệ ngang, dọc và vuông trong cùng bộ ảnh.",
      client: "Dự án minh họa", year: 2026, credits: "Hình ảnh: minh họa bố cục\nVai trò và đội ngũ thực tế sẽ được cập nhật khi thêm dự án thật.", tags: [entry.tag, "Light & texture"], featuredOrder: order, coverMediaId: entry.cover, isDemo: true,
      media: { create: [
        ...entry.main.map((mediaId, sortOrder) => ({ mediaId, placement: "MAIN" as const, sortOrder, alt: `Hình ảnh minh họa ${entry.title}, góc nhìn ${sortOrder + 1}`, caption: ["Ánh sáng & hình khối", "Sắc xanh dịu", "Chất liệu & sắc ấm", "Khoảng sáng", "Một góc nhìn gần hơn"][sortOrder] || entry.title })),
        ...["demo-bts-photo", "demo-bts-video", "demo-amber", "demo-film-lilac"].map((mediaId, sortOrder) => ({ mediaId, placement: "BEHIND_THE_SCENES" as const, sortOrder, alt: ["Bối cảnh studio với máy quay và đèn", "Video quá trình setup studio", "Chi tiết chất liệu sản phẩm", "Chuyển động sản phẩm trong ánh sáng"][sortOrder], caption: ["Setup ánh sáng", "On set diary", "Chi tiết chất liệu", "Từ setup đến khung hình"][sortOrder] })),
      ] },
    } });
  }
  await db.siteSettings.upsert({ where: { id: "site" }, create: { id: "site", data: { ...defaultSettings, heroProjectId: "demo-project-lueur" } }, update: {} });
  process.env.WORKER_LIBRARY_ONLY = "1";
  const { drainOne } = await import("../worker/index");
  while (await drainOne()) { /* Process the genuine image/video pipeline for demo assets. */ }
  const remaining = await db.media.count({ where: { status: { not: "READY" }, id: { startsWith: "demo-" } } });
  if (remaining) throw new Error(`${remaining} demo media items are not ready. Run npm run worker and inspect the job errors.`);
  const { publishProject } = await import("../worker/publication");
  for (const entry of entries) {
    const project = await db.project.findUniqueOrThrow({ where: { id: entry.id } });
    if (project.status !== "PUBLISHED" || (refresh && project.isDemo)) await publishProject(entry.id, project.revision);
  }
  console.log("Demo portfolio is ready. Admin login: use ADMIN_EMAIL / ADMIN_PASSWORD in your local .env file.");
  await db.$disconnect();
}
main().catch(async error => { console.error(error instanceof Error ? error.message : "Seed failed"); await db.$disconnect(); process.exitCode = 1; });
