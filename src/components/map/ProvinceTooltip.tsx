import type { SelectedProvince } from "../../types/map";
import styles from "./VietnamRemainsMap.module.css";

interface ProvinceTooltipProps {
  selectedProvince: SelectedProvince | null;
  onClose: () => void;
}

export default function ProvinceTooltip({
  selectedProvince,
  onClose,
}: ProvinceTooltipProps) {
  if (!selectedProvince) {
    return null;
  }

  function handleClose(
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.PointerEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    onClose();
  }

  return (
    <div
      className={styles.infoPanel}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        className={styles.closeButton}
        aria-label="Đóng bảng thông tin"
        title="Đóng"
        onClick={handleClose}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        ×
      </button>

      <div
        className={`${styles.revealItem} ${styles.reveal1}`}
      >
        <div className={styles.infoLabel}>
          TỈNH / THÀNH PHỐ
        </div>

        <h3>
          {selectedProvince.province}
        </h3>
      </div>

      {selectedProvince.tracked ? (
        <>
          {selectedProvince.siteName && (
            <div
              className={`${styles.revealItem} ${styles.reveal2}`}
            >
              <div className={styles.divider} />

              <div className={styles.infoLabel}>
                ĐỊA ĐIỂM
              </div>

              <div className={styles.locationName}>
                {selectedProvince.siteName}
              </div>
            </div>
          )}

          {typeof selectedProvince.remainsFound ===
            "number" && (
            <div
              className={`${styles.revealItem} ${styles.reveal3}`}
            >
              <div className={styles.divider} />

              <div className={styles.infoLabel}>
                HÀI CỐT ĐƯỢC PHÁT HIỆN
              </div>

              <div className={styles.remainsNumber}>
                {selectedProvince.province ===
                "Tuyên Quang"
                  ? `Khoảng ${selectedProvince.remainsFound.toLocaleString(
                      "vi-VN"
                    )}`
                  : selectedProvince.remainsFound.toLocaleString(
                      "vi-VN"
                    )}
              </div>

              {typeof selectedProvince.gravesFound ===
                "number" && (
                <div className={styles.subMeta}>
                  {
                    selectedProvince.gravesFound
                  }{" "}
                  mộ tập thể
                </div>
              )}
            </div>
          )}

          {selectedProvince.summary && (
            <div
              className={`${styles.revealItem} ${styles.reveal4}`}
            >
              <div className={styles.divider} />

              <div className={styles.infoLabel}>
                THÔNG TIN
              </div>

              <div className={styles.summaryText}>
                {selectedProvince.summary}
              </div>
            </div>
          )}

          {selectedProvince.details &&
            selectedProvince.details.length >
              0 && (
              <div
                className={`${styles.revealItem} ${styles.reveal5}`}
              >
                <div className={styles.divider} />

                <div
                  className={
                    styles.infoLabel
                  }
                >
                  CHI TIẾT
                </div>

                <ul
                  className={
                    styles.detailList
                  }
                >
                  {selectedProvince.details.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
        </>
      ) : (
        <div
          className={`${styles.revealItem} ${styles.reveal2}`}
        >
          <div className={styles.divider} />

          <div className={styles.noData}>
            Chưa có thông tin cho tỉnh/thành này.
          </div>
        </div>
      )}
    </div>
  );
}