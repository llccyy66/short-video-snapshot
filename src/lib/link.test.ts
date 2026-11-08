import { describe, expect, it } from "vitest";
import { parseLink } from "./link";

describe("parseLink", () => {
  it("recognizes a B站 video long link", () => {
    expect(parseLink("https://www.bilibili.com/video/BV1GJ411x7h7?p=1")).toMatchObject({ platform: "bilibili", kind: "video", id: "bili-BV1GJ411x7h7" });
  });
  it("recognizes a B站 share text with b23 short link", () => {
    expect(parseLink("【标题】 https://b23.tv/aBcD123 复制打开")).toMatchObject({ platform: "bilibili", kind: "video" });
  });
  it("recognizes a B站 UP主 homepage", () => {
    expect(parseLink("https://space.bilibili.com/1001")).toMatchObject({ platform: "bilibili", kind: "creator", id: "bili-up-1001" });
  });
  it("recognizes a 抖音 video", () => {
    expect(parseLink("https://www.douyin.com/video/7301234567890123456")).toMatchObject({ platform: "douyin", kind: "video" });
  });
  it("recognizes a 抖音 homepage", () => {
    expect(parseLink("https://www.douyin.com/user/MS4wLjABAAAA")).toMatchObject({ platform: "douyin", kind: "creator" });
  });
  it("rejects unrelated input", () => {
    expect(parseLink("https://www.youtube.com/watch?v=x")).toBeNull();
    expect(parseLink("随便一段话")).toBeNull();
  });
});
