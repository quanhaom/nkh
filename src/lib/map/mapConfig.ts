export const MAP_CONFIG = {
  // Dịch nhẹ sang phải để vẫn nhìn thấy vùng biển phía Đông
  center: [108.6, 15.8] as [number, number],

  // Tăng zoom để Việt Nam chiếm phần lớn khung
  zoom: 4.85,

  minZoom: 3.8,

  maxZoom: 11,

  archipelagos: [
    {
      name: "Quần đảo Hoàng Sa",
      shortName: "HOÀNG SA",
      coordinates: [112.0, 16.5] as [number, number],
    },

    {
      name: "Quần đảo Trường Sa",
      shortName: "TRƯỜNG SA",
      coordinates: [114.2, 10.2] as [number, number],
    },
  ],

  colors: {
    background: "#f5f8f3",

    provinceDefault: "#e5ebe6",

    provinceTracked: "#3c9465",

    provinceHover: "#17633e",

    border: "#ffffff",

    borderHover: "#0f472c",
  },
};