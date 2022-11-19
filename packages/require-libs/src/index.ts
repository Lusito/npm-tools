import { CssModule } from "./scss-modules";

export * from "./images";
export * from "./markdown";
export * from "./scss-modules";
export * from "./utils/copyAsset";
export * from "./utils/propertyDescriptor";

declare global {
    // @ts-expect-error It becomes valid in the final .d.ts file
    module "*.scss" {
        const content: CssModule;
        export = content;
    }
    // @ts-expect-error It becomes valid in the final .d.ts file
    module "*.css" {
        const content: CssModule;
        export = content;
    }
    // @ts-expect-error It becomes valid in the final .d.ts file
    module "*.png" {
        const content: string;
        export = content;
    }
    // @ts-expect-error It becomes valid in the final .d.ts file
    module "*.webp" {
        const content: string;
        export = content;
    }
    // @ts-expect-error It becomes valid in the final .d.ts file
    module "*.svg" {
        const content: string;
        export = content;
    }
    // @ts-expect-error It becomes valid in the final .d.ts file
    module "*.md" {
        const content: import("./markdown").MarkdownModule;
        export = content;
    }
}
