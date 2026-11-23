<script lang="ts">
export type IconName =
  | "mic"
  | "stop_circle"
  | "hourglass_top"
  | "arrow_upward"
  | "psychology"
  | "play_arrow"
  | "pause"
  | "chevron_right"
  | "logout"
  | "menu"
  | "close"
  | "folder_open"
  | "smart_toy"
  | "dns"
  | "database"
  | "check_circle"
  | "pending"
  | "info"
  | "chat_bubble"
  | "account_tree"
  | "history"
  | "insights"
  | "description";
</script>

<script setup lang="ts">
defineProps<{
  name: IconName;
}>();
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="inline-block h-[1em] w-[1em] shrink-0"
    aria-hidden="true"
  >
    <template v-if="name === 'mic'">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="8.5" y1="21" x2="15.5" y2="21" />
    </template>

    <template v-else-if="name === 'stop_circle'">
      <circle cx="12" cy="12" r="9" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </template>

    <template v-else-if="name === 'hourglass_top'">
      <path d="M6 3h12" />
      <path d="M6 21h12" />
      <path d="M7 3v4.5a5 5 0 0 0 5 4.5 5 5 0 0 0 5-4.5V3" />
      <path d="M7 21v-4.5a5 5 0 0 1 5-4.5 5 5 0 0 1 5 4.5V21" />
    </template>

    <template v-else-if="name === 'arrow_upward'">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="6 11 12 5 18 11" />
    </template>

    <template v-else-if="name === 'psychology'">
      <path d="M9.5 18v2.5h5V18" />
      <path d="M8.5 15.5c-2.1-1-3.5-3.1-3.5-5.5a7 7 0 0 1 14 0c0 2.4-1.4 4.5-3.5 5.5" />
      <circle cx="12" cy="10" r="2.2" />
    </template>

    <template v-else-if="name === 'play_arrow'">
      <polygon points="7 5 19 12 7 19 7 5" />
    </template>

    <template v-else-if="name === 'pause'">
      <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
      <rect x="14" y="5" width="3.5" height="14" rx="1" />
    </template>

    <template v-else-if="name === 'chevron_right'">
      <polyline points="9 6 15 12 9 18" />
    </template>

    <template v-else-if="name === 'logout'">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </template>

    <template v-else-if="name === 'menu'">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </template>

    <template v-else-if="name === 'close'">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </template>

    <template v-else-if="name === 'folder_open'">
      <path
        d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H5.5a2 2 0 0 0-1.9 1.4L2.5 18A2 2 0 0 0 4.4 20h14.4a2 2 0 0 0 1.9-1.4L22 12H5.5"
      />
    </template>

    <template v-else-if="name === 'smart_toy'">
      <rect x="4" y="8" width="16" height="11" rx="2" />
      <line x1="12" y1="4" x2="12" y2="8" />
      <circle cx="12" cy="3.5" r="1" />
      <circle cx="9" cy="13.5" r="1" />
      <circle cx="15" cy="13.5" r="1" />
    </template>

    <template v-else-if="name === 'dns'">
      <rect x="3" y="4" width="18" height="7" rx="1.5" />
      <rect x="3" y="13" width="18" height="7" rx="1.5" />
      <circle cx="7" cy="7.5" r="0.8" />
      <circle cx="7" cy="16.5" r="0.8" />
    </template>

    <template v-else-if="name === 'database'">
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </template>

    <template v-else-if="name === 'check_circle'">
      <circle cx="12" cy="12" r="9" />
      <polyline points="8.5 12.5 11 15 15.5 9.5" />
    </template>

    <template v-else-if="name === 'pending'">
      <circle cx="12" cy="12" r="9" />
      <circle cx="8.5" cy="12" r="0.8" />
      <circle cx="12" cy="12" r="0.8" />
      <circle cx="15.5" cy="12" r="0.8" />
    </template>

    <template v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="8" r="0.8" />
    </template>

    <template v-else-if="name === 'chat_bubble'">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </template>

    <template v-else-if="name === 'account_tree'">
      <rect x="3" y="4" width="6" height="5" rx="1" />
      <rect x="15" y="4" width="6" height="5" rx="1" />
      <rect x="15" y="15" width="6" height="5" rx="1" />
      <path d="M9 6.5h6" />
      <path d="M12 6.5v11h3" />
    </template>

    <template v-else-if="name === 'history'">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <polyline points="3 3 3 8 8 8" />
      <polyline points="12 7 12 12 15.5 14" />
    </template>

    <template v-else-if="name === 'insights'">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="16 7 21 7 21 12" />
    </template>

    <template v-else-if="name === 'description'">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </template>
  </svg>
</template>
