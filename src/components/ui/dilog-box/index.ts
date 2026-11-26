// Dialog box of the Mess Manager design system.
// Native <dialog> + GSAP motion (scale/fade, stagger, must-answer nudge) + cva variants.
export { Dialog, DialogTrigger, DialogClose, useDialog, type DialogProps } from "./dialog";
export { DialogContent, type DialogContentProps } from "./dialog-content";
export { DialogHeader, DialogIcon, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "./dialog-parts";
export { ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog";
export { ConfirmHost } from "./confirm-host";
export {
  dialogPanelVariants, dialogLayoutVariants, dialogOverlayVariants, dialogIconVariants, dialogActionVariants,
  type DialogPanelVariants, type DialogLayoutVariants, type DialogOverlayVariants, type DialogTone,
} from "./dialog-variants";
