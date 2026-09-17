import type { ProvinceInteractiveData } from "../types/map";

export const remainsData: ProvinceInteractiveData[] = [
  {
    province: "Tuyên Quang",
    siteName: "Tuyên Quang",
    remainsFound: 23,
    gravesFound: 5,
    summary:
      "Tìm thấy 5 mộ tập thể, với khoảng 23 hài cốt liệt sĩ.",
    details: [
      "Các đợt tìm kiếm diễn ra trong nhiều thời điểm.",
      "Một số khu vực được nhắc đến gồm các điểm cao 211A, 685 và 823.",
    ],
  },

  {
    province: "Hồ Chí Minh",
    siteName: "Công viên Lê Thị Riêng, TPHCM",
    remainsFound: 418,
    summary:
      "Phát hiện 418 hài cốt liệt sĩ.",
    details: [],
  },

  {
    province: "Quảng Trị",
    siteName: "Câu Nhi, Quảng Trị",
    remainsFound: 13,
    summary:
      "Phát hiện 13 hài cốt liệt sĩ.",
    details: [],
  },

  {
    province: "Đồng Nai",
    siteName: "Xã Minh Đức, TP. Đồng Nai",
    remainsFound: 26,
    summary:
      "Phát hiện 26 hài cốt.",
    details: [],
  },

  {
    province: "Đắk Lắk",
    siteName: "Xã Đắk Pé, Đắk Lắk",
    remainsFound: 10,
    summary:
      "Phát hiện 10 hài cốt.",
    details: [],
  },

  {
    province: "Quảng Ngãi",
    siteName: "Đường Trường Chinh, Quảng Ngãi",
    remainsFound: 4,
    summary:
      "Phát hiện 4 hài cốt liệt sĩ.",
    details: [],
  },
];

export const provincesWithData = remainsData.length;

export const totalRemainsMentioned = remainsData.reduce(
  (total, item) => total + (item.remainsFound ?? 0),
  0
);