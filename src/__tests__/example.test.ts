import { describe, expect, it } from "vitest";

describe("Testing Environment Setup", () => {
  it("should run a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should have access to jest-dom matchers", () => {
    const element = document.createElement("div");
    element.textContent = "Hello World";
    document.body.appendChild(element);

    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent("Hello World");

    // Clean up
    document.body.removeChild(element);
  });
});
