import VietnamRemainsMap from "../components/map/VietnamRemainsMap";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <span className="eyebrow">GOLD</span>

        <h1>Bản đồ dữ liệu Việt Nam</h1>

        <p>
          Khám phá dữ liệu theo từng tỉnh, thành phố trên bản đồ tương tác.
        </p>
      </section>

      <VietnamRemainsMap />
    </main>
  );
}