"use client";

import { useEffect, useRef, useState } from "react";

import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";

import type { Map as MapLibreMap } from "maplibre-gl";

import {
  remainsData,
  provincesWithData,
  totalRemainsMentioned,
} from "../../data/remains";

import { normalizeProvinceName } from "../../lib/map/normalizeProvinceName";
import { MAP_CONFIG } from "../../lib/map/mapConfig";

import type {
  ProvinceInteractiveData,
  SelectedProvince,
} from "../../types/map";

import MapLegend from "./MapLegend";
import ProvinceTooltip from "./ProvinceTooltip";

import styles from "./VietnamRemainsMap.module.css";

/* =========================================================
   TYPES
========================================================= */

type ExtendedProperties = GeoJsonProperties & {
  __provinceName?: string;

  __tracked?: boolean;

  __siteName?: string;

  __remainsFound?: number;

  __gravesFound?: number;

  __summary?: string;

  __details?: string[];
};

/* =========================================================
   CONSTANTS
========================================================= */

const SOURCE_ID = "vietnam-provinces";

const FILL_LAYER_ID = "province-fill";

const BORDER_LAYER_ID = "province-border";

/**
 * Danh sách 34 tỉnh / thành sau sắp xếp.
 *
 * Dùng để tìm chính xác tên tỉnh trong GeoJSON,
 * tránh trường hợp lấy nhầm property khác.
 */
const VIETNAM_PROVINCES = [
  "Hà Nội",
  "Huế",
  "Lai Châu",
  "Điện Biên",
  "Sơn La",
  "Lạng Sơn",
  "Cao Bằng",
  "Tuyên Quang",
  "Lào Cai",
  "Thái Nguyên",
  "Phú Thọ",
  "Bắc Ninh",
  "Quảng Ninh",
  "Hưng Yên",
  "Hải Phòng",
  "Ninh Bình",
  "Thanh Hóa",
  "Nghệ An",
  "Hà Tĩnh",
  "Quảng Trị",
  "Đà Nẵng",
  "Quảng Ngãi",
  "Gia Lai",
  "Đắk Lắk",
  "Khánh Hòa",
  "Lâm Đồng",
  "Đồng Nai",
  "Tây Ninh",
  "Hồ Chí Minh",
  "Đồng Tháp",
  "Vĩnh Long",
  "An Giang",
  "Cần Thơ",
  "Cà Mau",
];

/**
 * Dùng normalized name để match dữ liệu.
 *
 * Ví dụ:
 *
 * TP Hồ Chí Minh
 * Thành phố Hồ Chí Minh
 * Hồ Chí Minh
 *
 * đều về cùng một key.
 */
const NORMALIZED_PROVINCES = new Map(
  VIETNAM_PROVINCES.map((province) => [
    normalizeProvinceName(province),
    province,
  ])
);

/**
 * Tọa độ nhãn 6 tỉnh có dữ liệu.
 *
 * Đây chỉ là vị trí label để UI dễ đọc,
 * không dùng làm ranh giới hành chính.
 */
const TRACKED_PROVINCE_LABELS = [
  {
    province: "Tuyên Quang",
    coordinates: [105.22, 22.13] as [number, number],
  },

  {
    province: "Quảng Trị",
    coordinates: [107.05, 16.75] as [number, number],
  },

  {
    province: "Quảng Ngãi",
    coordinates: [108.75, 15.12] as [number, number],
  },

  {
    province: "Đắk Lắk",
    coordinates: [108.05, 12.7] as [number, number],
  },

  {
    province: "Đồng Nai",
    coordinates: [107.15, 11.0] as [number, number],
  },

  {
    province: "Hồ Chí Minh",
    coordinates: [106.65, 10.78] as [number, number],
  },
];

/* =========================================================
   GET PROVINCE NAME FROM GEOJSON
========================================================= */

function getProvinceName(
  properties: GeoJsonProperties
): string {
  if (!properties) {
    return "Không xác định";
  }

  /**
   * Các field thường gặp trong GeoJSON.
   */
  const possibleKeys = [
    "province",
    "Province",
    "PROVINCE",

    "name",
    "Name",
    "NAME",

    "name_vi",
    "NAME_VI",

    "ten_tinh",
    "TEN_TINH",

    "NAME_1",
    "VARNAME_1",

    "full_name",
    "FULL_NAME",
    "fullname",

    "ADM1_VI",
    "ADM1_EN",
  ];

  /**
   * Ưu tiên field có tên quen thuộc.
   */
  for (const key of possibleKeys) {
    const value = properties[key];

    if (
      typeof value !== "string" ||
      value.trim().length === 0
    ) {
      continue;
    }

    const normalized =
      normalizeProvinceName(value);

    const matched =
      NORMALIZED_PROVINCES.get(
        normalized
      );

    if (matched) {
      return matched;
    }
  }

  /**
   * Nếu dataset dùng tên field khác,
   * quét toàn bộ properties.
   */
  for (const value of Object.values(
    properties
  )) {
    if (
      typeof value !== "string" ||
      value.trim().length === 0
    ) {
      continue;
    }

    const normalized =
      normalizeProvinceName(value);

    const matched =
      NORMALIZED_PROVINCES.get(
        normalized
      );

    if (matched) {
      return matched;
    }
  }

  return "Không xác định";
}

/* =========================================================
   BOUNDS
========================================================= */

function calculateGeometryBounds(
  geometry: Geometry
): [[number, number], [number, number]] | null {
  let minLng = Infinity;

  let minLat = Infinity;

  let maxLng = -Infinity;

  let maxLat = -Infinity;

  function walkCoordinates(
    value: unknown
  ): void {
    if (!Array.isArray(value)) {
      return;
    }

    /**
     * Found coordinate [lng, lat]
     */
    if (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      const lng = value[0];

      const lat = value[1];

      minLng = Math.min(
        minLng,
        lng
      );

      minLat = Math.min(
        minLat,
        lat
      );

      maxLng = Math.max(
        maxLng,
        lng
      );

      maxLat = Math.max(
        maxLat,
        lat
      );

      return;
    }

    for (const child of value) {
      walkCoordinates(child);
    }
  }

  if ("coordinates" in geometry) {
    walkCoordinates(
      geometry.coordinates
    );
  }

  if (
    !Number.isFinite(minLng) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLng) ||
    !Number.isFinite(maxLat)
  ) {
    return null;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/* =========================================================
   COMPONENT
========================================================= */

export default function VietnamRemainsMap() {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const mapRef =
    useRef<MapLibreMap | null>(
      null
    );

  /**
   * HTML markers:
   *
   * - Hoàng Sa
   * - Trường Sa
   * - tên 6 tỉnh có dữ liệu
   */
  const markerRefs = useRef<
    Array<{ remove: () => void }>
  >([]);

  const [
    selectedProvince,
    setSelectedProvince,
  ] =
    useState<SelectedProvince | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     INITIALIZE MAP
  ======================================================= */

  useEffect(() => {
    if (
      !mapContainerRef.current
    ) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    let disposed = false;

    async function initializeMap() {
      try {
        const maplibre =
          await import(
            "maplibre-gl"
          );

        /**
         * Worker đã được copy vào public/maplibre
         */
        maplibre.setWorkerUrl(
          "/maplibre/maplibre-gl-worker.mjs"
        );

        if (
          disposed ||
          !mapContainerRef.current
        ) {
          return;
        }

        /* =================================================
           CREATE MAP
        ================================================= */

        const map =
          new maplibre.Map({
            container:
              mapContainerRef.current,

            style: {
              version: 8,

              sources: {},

              layers: [
                {
                  id: "background",

                  type: "background",

                  paint: {
                    "background-color":
                      MAP_CONFIG
                        .colors
                        .background,
                  },
                },
              ],
            },

            /**
             * Không dùng fitBounds ban đầu.
             *
             * Cách này giúp Việt Nam lớn hơn
             * nhưng vẫn giữ vùng biển phía Đông.
             */
            center:
              MAP_CONFIG.center,

            zoom:
              MAP_CONFIG.zoom,

            minZoom:
              MAP_CONFIG.minZoom,

            maxZoom:
              MAP_CONFIG.maxZoom,

            attributionControl:
              false,
          });

        mapRef.current = map;

        /* =================================================
           CONTROLS
        ================================================= */

        map.addControl(
          new maplibre.NavigationControl(
            {
              showCompass: false,

              visualizePitch:
                false,
            }
          ),

          "top-right"
        );

        /* =================================================
           MAP LOAD
        ================================================= */

        map.on(
          "load",
          async () => {
            try {
              /* ===========================================
                 FETCH GEOJSON
              =========================================== */

              const response =
                await fetch(
                  "/data/map/vietnam-provinces.geojson"
                );

              if (!response.ok) {
                throw new Error(
                  `Không tải được GeoJSON: ${response.status}`
                );
              }

              const geoJson =
                (await response.json()) as FeatureCollection<
                  Geometry,
                  ExtendedProperties
                >;

              /* ===========================================
                 DATA LOOKUP
              =========================================== */

              const remainsLookup =
                new Map<
                  string,
                  ProvinceInteractiveData
                >(
                  remainsData.map(
                    (item) => [
                      normalizeProvinceName(
                        item.province
                      ),

                      item,
                    ]
                  )
                );

              /* ===========================================
                 ATTACH DATA TO GEOJSON
              =========================================== */

              const enhancedGeoJson: FeatureCollection<
                Geometry,
                ExtendedProperties
              > = {
                ...geoJson,

                features:
                  geoJson.features.map(
                    (
                      feature: Feature<
                        Geometry,
                        ExtendedProperties
                      >
                    ) => {
                      const properties =
                        feature.properties ??
                        {};

                      const province =
                        getProvinceName(
                          properties
                        );

                      const normalized =
                        normalizeProvinceName(
                          province
                        );

                      const data =
                        remainsLookup.get(
                          normalized
                        );

                      return {
                        ...feature,

                        properties: {
                          ...properties,

                          __provinceName:
                            province,

                          __tracked:
                            Boolean(
                              data
                            ),

                          __siteName:
                            data?.siteName ??
                            "",

                          __remainsFound:
                            data?.remainsFound ??
                            -1,

                          __gravesFound:
                            data?.gravesFound ??
                            -1,

                          __summary:
                            data?.summary ??
                            "",

                          __details:
                            data?.details ??
                            [],
                        },
                      };
                    }
                  ),
              };

              /* ===========================================
                 DEV CHECK
              =========================================== */

              const matched =
                enhancedGeoJson.features
                  .filter(
                    (feature) =>
                      feature
                        .properties
                        ?.__tracked ===
                      true
                  )
                  .map(
                    (feature) =>
                      feature
                        .properties
                        ?.__provinceName
                  );

              console.log(
                "Matched provinces:",
                matched
              );

              /* ===========================================
                 ADD SOURCE
              =========================================== */

              map.addSource(
                SOURCE_ID,
                {
                  type: "geojson",

                  data:
                    enhancedGeoJson,

                  generateId:
                    true,
                }
              );

              /* ===========================================
                 FILL LAYER
              =========================================== */

              map.addLayer({
                id: FILL_LAYER_ID,

                type: "fill",

                source:
                  SOURCE_ID,

                paint: {
                  "fill-color": [
                    "case",

                    /**
                     * Hover
                     */
                    [
                      "boolean",

                      [
                        "feature-state",
                        "hover",
                      ],

                      false,
                    ],

                    MAP_CONFIG
                      .colors
                      .provinceHover,

                    /**
                     * Có dữ liệu
                     */
                    [
                      "boolean",

                      [
                        "get",
                        "__tracked",
                      ],

                      false,
                    ],

                    MAP_CONFIG
                      .colors
                      .provinceTracked,

                    /**
                     * Không dữ liệu
                     */
                    MAP_CONFIG
                      .colors
                      .provinceDefault,
                  ],

                  "fill-opacity":
                    [
                      "case",

                      [
                        "boolean",

                        [
                          "feature-state",
                          "hover",
                        ],

                        false,
                      ],

                      0.98,

                      0.9,
                    ],
                },
              });

              /* ===========================================
                 BORDER
              =========================================== */

              map.addLayer({
                id: BORDER_LAYER_ID,

                type: "line",

                source:
                  SOURCE_ID,

                paint: {
                  "line-color": [
                    "case",

                    [
                      "boolean",

                      [
                        "feature-state",
                        "hover",
                      ],

                      false,
                    ],

                    MAP_CONFIG
                      .colors
                      .borderHover,

                    MAP_CONFIG
                      .colors
                      .border,
                  ],

                  "line-width": [
                    "case",

                    [
                      "boolean",

                      [
                        "feature-state",
                        "hover",
                      ],

                      false,
                    ],

                    2,

                    0.8,
                  ],

                  "line-opacity":
                    1,
                },
              });

              /* ===========================================
                 HOÀNG SA + TRƯỜNG SA
              =========================================== */

              for (
                const archipelago of
                MAP_CONFIG.archipelagos
              ) {
                const element =
                  document.createElement(
                    "div"
                  );

                element.className =
                  styles.archipelagoMarker;

                const dot =
                  document.createElement(
                    "span"
                  );

                dot.className =
                  styles.archipelagoDot;

                const label =
                  document.createElement(
                    "span"
                  );

                label.className =
                  styles.archipelagoLabel;

                label.textContent =
                  archipelago.shortName;

                element.appendChild(
                  dot
                );

                element.appendChild(
                  label
                );

                element.title =
                  archipelago.name;

                const marker =
                  new maplibre.Marker(
                    {
                      element,

                      anchor:
                        "center",
                    }
                  )
                    .setLngLat(
                      archipelago.coordinates
                    )
                    .addTo(map);

                markerRefs.current.push(
                  marker
                );
              }

              /* ===========================================
                 LABEL 6 TỈNH
              =========================================== */

              for (
                const item of
                TRACKED_PROVINCE_LABELS
              ) {
                const element =
                  document.createElement(
                    "div"
                  );

                element.className =
                  styles.provinceMapLabel;

                element.textContent =
                  item.province;

                const marker =
                  new maplibre.Marker(
                    {
                      element,

                      anchor:
                        "center",
                    }
                  )
                    .setLngLat(
                      item.coordinates
                    )
                    .addTo(map);

                markerRefs.current.push(
                  marker
                );
              }

              /* ===========================================
                 HOVER
              =========================================== */

              let hoveredFeatureId:
                | string
                | number
                | null = null;

              const popup =
                new maplibre.Popup(
                  {
                    closeButton:
                      false,

                    closeOnClick:
                      false,

                    offset: 12,

                    maxWidth:
                      "290px",
                  }
                );

              map.on(
                "mousemove",

                FILL_LAYER_ID,

                (event) => {
                  map.getCanvas().style.cursor =
                    "pointer";

                  const feature =
                    event
                      .features?.[0];

                  if (!feature) {
                    return;
                  }

                  /* ===============================
                     CLEAR PREVIOUS HOVER
                  =============================== */

                  if (
                    hoveredFeatureId !==
                    null
                  ) {
                    map.setFeatureState(
                      {
                        source:
                          SOURCE_ID,

                        id:
                          hoveredFeatureId,
                      },

                      {
                        hover:
                          false,
                      }
                    );
                  }

                  /* ===============================
                     NEW HOVER
                  =============================== */

                  if (
                    feature.id !==
                    undefined
                  ) {
                    hoveredFeatureId =
                      feature.id;

                    map.setFeatureState(
                      {
                        source:
                          SOURCE_ID,

                        id:
                          feature.id,
                      },

                      {
                        hover:
                          true,
                      }
                    );
                  }

                  const province =
                    String(
                      feature
                        .properties
                        ?.__provinceName ??
                        "Không xác định"
                    );

                  const tracked =
                    feature
                      .properties
                      ?.__tracked ===
                    true;

                  const siteName =
                    String(
                      feature
                        .properties
                        ?.__siteName ??
                        ""
                    );

                  const remains =
                    Number(
                      feature
                        .properties
                        ?.__remainsFound ??
                        -1
                    );

                  const graves =
                    Number(
                      feature
                        .properties
                        ?.__gravesFound ??
                        -1
                    );

                  /* ===============================
                     POPUP DOM
                  =============================== */

                  const popupElement =
                    document.createElement(
                      "div"
                    );

                  popupElement.className =
                    styles.mapPopup;

                  /* Province */

                  const title =
                    document.createElement(
                      "strong"
                    );

                  title.textContent =
                    province.toUpperCase();

                  popupElement.appendChild(
                    title
                  );

                  if (tracked) {
                    /* Location */

                    if (siteName) {
                      const location =
                        document.createElement(
                          "div"
                        );

                      location.className =
                        styles.popupLocation;

                      location.textContent =
                        siteName;

                      popupElement.appendChild(
                        location
                      );
                    }

                    /* Remains */

                    const remainsLine =
                      document.createElement(
                        "div"
                      );

                    remainsLine.className =
                      styles.popupNumber;

                    if (
                      province ===
                      "Tuyên Quang"
                    ) {
                      remainsLine.textContent =
                        `Khoảng ${remains.toLocaleString(
                          "vi-VN"
                        )} hài cốt`;
                    } else {
                      remainsLine.textContent =
                        `${remains.toLocaleString(
                          "vi-VN"
                        )} hài cốt`;
                    }

                    popupElement.appendChild(
                      remainsLine
                    );

                    /* Graves */

                    if (
                      graves >= 0
                    ) {
                      const gravesLine =
                        document.createElement(
                          "div"
                        );

                      gravesLine.textContent =
                        `${graves} mộ tập thể`;

                      popupElement.appendChild(
                        gravesLine
                      );
                    }

                    /* Hint */

                    const hint =
                      document.createElement(
                        "span"
                      );

                    hint.className =
                      styles.popupHint;

                    hint.textContent =
                      "Bấm để xem chi tiết";

                    popupElement.appendChild(
                      hint
                    );
                  } else {
                    const noData =
                      document.createElement(
                        "div"
                      );

                    noData.textContent =
                      "Chưa có thông tin trong dữ liệu hiện tại";

                    popupElement.appendChild(
                      noData
                    );
                  }

                  popup
                    .setLngLat(
                      event.lngLat
                    )
                    .setDOMContent(
                      popupElement
                    )
                    .addTo(map);
                }
              );

              /* ===========================================
                 LEAVE
              =========================================== */

              map.on(
                "mouseleave",

                FILL_LAYER_ID,

                () => {
                  map.getCanvas().style.cursor =
                    "";

                  popup.remove();

                  if (
                    hoveredFeatureId !==
                    null
                  ) {
                    map.setFeatureState(
                      {
                        source:
                          SOURCE_ID,

                        id:
                          hoveredFeatureId,
                      },

                      {
                        hover:
                          false,
                      }
                    );
                  }

                  hoveredFeatureId =
                    null;
                }
              );

              /* ===========================================
                 CLICK
              =========================================== */

              map.on(
                "click",

                FILL_LAYER_ID,

                (event) => {
                  const feature =
                    event
                      .features?.[0];

                  if (!feature) {
                    return;
                  }

                  popup.remove();

                  const province =
                    String(
                      feature
                        .properties
                        ?.__provinceName ??
                        "Không xác định"
                    );

                  const tracked =
                    feature
                      .properties
                      ?.__tracked ===
                    true;

                  const siteName =
                    String(
                      feature
                        .properties
                        ?.__siteName ??
                        ""
                    );

                  const remains =
                    Number(
                      feature
                        .properties
                        ?.__remainsFound ??
                        -1
                    );

                  const graves =
                    Number(
                      feature
                        .properties
                        ?.__gravesFound ??
                        -1
                    );

                  const summary =
                    String(
                      feature
                        .properties
                        ?.__summary ??
                        ""
                    );

                  /* ===============================
                     DETAILS
                  =============================== */

                  let details:
                    string[] = [];

                  const rawDetails =
                    feature
                      .properties
                      ?.__details;

                  if (
                    Array.isArray(
                      rawDetails
                    )
                  ) {
                    details =
                      rawDetails.map(
                        String
                      );
                  } else if (
                    typeof rawDetails ===
                    "string"
                  ) {
                    try {
                      const parsed =
                        JSON.parse(
                          rawDetails
                        );

                      if (
                        Array.isArray(
                          parsed
                        )
                      ) {
                        details =
                          parsed.map(
                            String
                          );
                      }
                    } catch {
                      details = [];
                    }
                  }

                  /* ===============================
                     PANEL
                  =============================== */

                  setSelectedProvince(
                    {
                      province,

                      tracked,

                      siteName:
                        tracked &&
                        siteName
                          ? siteName
                          : undefined,

                      remainsFound:
                        tracked &&
                        remains >=
                          0
                          ? remains
                          : undefined,

                      gravesFound:
                        tracked &&
                        graves >=
                          0
                          ? graves
                          : undefined,

                      summary:
                        tracked &&
                        summary
                          ? summary
                          : undefined,

                      details:
                        tracked
                          ? details
                          : [],
                    }
                  );

                  /* ===============================
                     ZOOM
                  =============================== */

                  if (
                    !feature.geometry
                  ) {
                    return;
                  }

                  const bounds =
                    calculateGeometryBounds(
                      feature.geometry
                    );

                  if (!bounds) {
                    return;
                  }

                  const isMobile =
                    window.innerWidth <=
                    768;

                  map.fitBounds(
                    bounds,

                    {
                      padding:
                        isMobile
                          ? {
                              top: 200,

                              right:
                                40,

                              bottom:
                                60,

                              left: 40,
                            }
                          : {
                              top: 80,

                              right:
                                100,

                              bottom:
                                80,

                              /**
                               * Chừa chỗ cho info panel.
                               */
                              left: 390,
                            },

                      maxZoom:
                        7.4,

                      duration:
                        750,
                    }
                  );
                }
              );

              /* ===========================================
                 DONE
              =========================================== */

              setLoading(false);
            } catch (
              mapError
            ) {
              console.error(
                mapError
              );

              setError(
                mapError instanceof
                  Error
                  ? mapError.message
                  : "Không thể tải bản đồ"
              );

              setLoading(
                false
              );
            }
          }
        );
      } catch (
        initializationError
      ) {
        console.error(
          initializationError
        );

        setError(
          initializationError instanceof
            Error
            ? initializationError.message
            : "Không thể khởi tạo MapLibre"
        );

        setLoading(false);
      }
    }

    initializeMap();

    /* =====================================================
       CLEANUP
    ===================================================== */

    return () => {
      disposed = true;

      for (
        const marker of
        markerRefs.current
      ) {
        marker.remove();
      }

      markerRefs.current =
        [];

      mapRef.current?.remove();

      mapRef.current = null;
    };
  }, []);

  /* =======================================================
     RESET
  ======================================================= */

  function resetMap() {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    map.easeTo({
      center:
        MAP_CONFIG.center,

      zoom:
        MAP_CONFIG.zoom,

      duration: 700,
    });

    setSelectedProvince(
      null
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      className={styles.wrapper}
    >
      {/* ================================================
          HEADER
      ================================================= */}

      <div
        className={
          styles.mapHeader
        }
      >
        <div
          className={
            styles.headerContent
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            THƯ — INTERACTIVE
          </span>

          <h2>
            Bản đồ tìm kiếm và
            phát hiện hài cốt
            liệt sĩ
          </h2>

          <p>
            Những tỉnh, thành có
            thông tin được tô màu
            xanh. Di chuột để xem
            nhanh và bấm vào từng
            tỉnh để khám phá chi
            tiết.
          </p>

          {/* ============================================
              STATS
          ============================================= */}

          <div
            className={
              styles.mapStats
            }
          >
            <div
              className={
                styles.statItem
              }
            >
              <strong>
                {
                  provincesWithData
                }
              </strong>

              <span>
                Tỉnh / thành
                <br />
                có thông tin
              </span>
            </div>

            <div
              className={
                styles.statDivider
              }
            />

            <div
              className={
                styles.statItem
              }
            >
              <strong>
                ≈{" "}
                {totalRemainsMentioned.toLocaleString(
                  "vi-VN"
                )}
              </strong>

              <span>
                Hài cốt
                <br />
                được nhắc đến
              </span>
            </div>
          </div>
        </div>

        {/* ==============================================
            RESET
        =============================================== */}

        <button
          type="button"
          className={
            styles.resetButton
          }
          onClick={resetMap}
        >
          Xem toàn quốc
        </button>
      </div>

      {/* ================================================
          MAP
      ================================================= */}

      <div
        className={
          styles.mapShell
        }
      >
        <div
          ref={
            mapContainerRef
          }
          className={
            styles.map
          }
        />

        {/* ==============================================
            LOADING
        =============================================== */}

        {loading && (
          <div
            className={
              styles.loading
            }
          >
            <div
              className={
                styles.loadingContent
              }
            >
              <span
                className={
                  styles.loadingDot
                }
              />

              Đang tải bản đồ...
            </div>
          </div>
        )}

        {/* ==============================================
            ERROR
        =============================================== */}

        {error && (
          <div
            className={
              styles.error
            }
          >
            <strong>
              Không thể hiển thị
              bản đồ
            </strong>

            <span>
              {error}
            </span>
          </div>
        )}

        {/* ==============================================
            LEGEND
        =============================================== */}

        <MapLegend />

        {/* ==============================================
            INFO PANEL
        =============================================== */}

        <ProvinceTooltip
          selectedProvince={
            selectedProvince
          }
          onClose={() =>
            setSelectedProvince(
              null
            )
          }
        />
      </div>

      {/* ================================================
          FOOTER
      ================================================= */}

      <div
        className={
          styles.mapFooter
        }
      >
        <span>
          6 tỉnh/thành được làm
          nổi bật dựa trên nội
          dung hiện có.
        </span>

        <span>
          Kéo để di chuyển · Cuộn
          để phóng to · Bấm tỉnh
          để xem chi tiết
        </span>
      </div>
    </section>
  );
}