import { extendTailwindMerge } from 'tailwind-merge';

// `rounded-default` comes from the themable borderRadius.default token, tailwind-merge does not
// know it out of the box and would not treat it as conflicting with rounded-* passed from outside
export const mergeClasses = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ['default'] }],
    },
  },
});
