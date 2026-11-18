interface ImportMetaEnv {
  /** True only under `astro dev`: drafts and scheduled notes are shown. Set in astro.config.mjs. */
  readonly SHOW_UNPUBLISHED: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
