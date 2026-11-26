// Visual variants for the drawer (class-variance-authority).
// Panel: side × size × tone. Overlay: dim / blur / none.
import { cva, type VariantProps } from "class-variance-authority";

export const drawerPanelVariants = cva(
  // base: fixed panel, column layout so Header/Footer stay put and Body scrolls
  "fixed flex flex-col text-ink shadow-2xl outline-none will-change-transform",
  {
    variants: {
      side: {
        bottom: "inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-3xl pb-[env(safe-area-inset-bottom)]",
        top: "inset-x-0 top-0 mx-auto w-full max-w-md rounded-b-3xl pt-[env(safe-area-inset-top)]",
        left: "inset-y-0 left-0 h-dvh rounded-r-3xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        right: "inset-y-0 right-0 h-dvh rounded-l-3xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
      },
      size: {
        auto: "",
        sm: "",
        md: "",
        lg: "",
        full: "",
      },
      tone: {
        default: "bg-card",
        surface: "bg-surface",
        brand: "bg-brand-soft",
      },
    },
    compoundVariants: [
      // bottom / top sheets: height
      { side: ["bottom", "top"], size: "auto", class: "max-h-[92dvh]" },
      { side: ["bottom", "top"], size: "sm", class: "h-[40dvh]" },
      { side: ["bottom", "top"], size: "md", class: "h-[60dvh]" },
      { side: ["bottom", "top"], size: "lg", class: "h-[88dvh]" },
      { side: ["bottom", "top"], size: "full", class: "h-dvh max-w-none rounded-none" },
      // side panels: width
      { side: ["left", "right"], size: ["auto", "md"], class: "w-80 max-w-[85vw]" },
      { side: ["left", "right"], size: "sm", class: "w-64 max-w-[80vw]" },
      { side: ["left", "right"], size: "lg", class: "w-[28rem] max-w-[92vw]" },
      { side: ["left", "right"], size: "full", class: "w-screen max-w-none rounded-none" },
    ],
    defaultVariants: { side: "bottom", size: "auto", tone: "default" },
  },
);

export const drawerOverlayVariants = cva("absolute inset-0", {
  variants: {
    overlay: {
      dim: "bg-black/45",
      blur: "bg-black/30 backdrop-blur-sm",
      none: "bg-transparent",
    },
  },
  defaultVariants: { overlay: "dim" },
});

export type DrawerPanelVariants = VariantProps<typeof drawerPanelVariants>;
export type DrawerOverlayVariants = VariantProps<typeof drawerOverlayVariants>;
export type DrawerSide = NonNullable<DrawerPanelVariants["side"]>;
