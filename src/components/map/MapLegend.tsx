import styles from "./VietnamRemainsMap.module.css";

export default function MapLegend() {
  return (
    <div className={styles.legend}>
      <div className={styles.legendTitle}>
        Chú thích
      </div>

      <div className={styles.legendRow}>
        <span
          className={`${styles.legendColor} ${styles.tracked}`}
        />
        <span>Tỉnh có thông tin</span>
      </div>

      <div className={styles.legendRow}>
        <span
          className={`${styles.legendColor} ${styles.defaultProvince}`}
        />
        <span>Tỉnh chưa có thông tin</span>
      </div>

      <div className={styles.legendRow}>
        <span className={styles.legendArchipelagoDot} />
        <span>Nhãn quần đảo</span>
      </div>
    </div>
  );
}