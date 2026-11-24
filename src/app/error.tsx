"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="full-state" id="main-content"><p className="eyebrow">A SMALL PAUSE</p><h1>Chưa tải được trang.</h1><p>Vui lòng thử lại sau giây lát.</p><button className="button button-dark" onClick={reset}>Tải lại trang</button></main>; }
