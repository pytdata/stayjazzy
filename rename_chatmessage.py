import os
import glob

def replace_in_file(path, old, new):
    with open(path, 'r') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, 'w') as f:
            f.write(content)

# Update types.ts
with open('/workspace/app-bu4kziuqa9dt/src/types/types.ts', 'r') as f:
    types_content = f.read()

types_content = types_content.replace(
"""export interface ChatMessage {
  id: string
  booking_id: string
  sender_type: SenderType
  message: string
  created_at: string
}""",
"""export interface BookingChatMessage {
  id: string
  booking_id: string
  sender_type: SenderType
  message: string
  created_at: string
}"""
)
with open('/workspace/app-bu4kziuqa9dt/src/types/types.ts', 'w') as f:
    f.write(types_content)

# Replace in API
replace_in_file('/workspace/app-bu4kziuqa9dt/src/db/api.ts', "export async function getChatMessages(bookingId: string): Promise<ChatMessage[]>", "export async function getChatMessages(bookingId: string): Promise<BookingChatMessage[]>")
replace_in_file('/workspace/app-bu4kziuqa9dt/src/db/api.ts', "return (data ?? []) as ChatMessage[]", "return (data ?? []) as BookingChatMessage[]")
replace_in_file('/workspace/app-bu4kziuqa9dt/src/db/api.ts', "export async function sendChatMessageObj(msg: Partial<ChatMessage>)", "export async function sendChatMessageObj(msg: Partial<BookingChatMessage>)")
replace_in_file('/workspace/app-bu4kziuqa9dt/src/db/api.ts', "ChatMessage, PageView,", "ChatMessage, BookingChatMessage, PageView,")

# Replace in Booking pages
for page in ['/workspace/app-bu4kziuqa9dt/src/pages/admin/AdminBookingsPage.tsx', '/workspace/app-bu4kziuqa9dt/src/pages/BookingDashboardPage.tsx']:
    replace_in_file(page, "import type { Booking, ChatMessage", "import type { Booking, BookingChatMessage")
    replace_in_file(page, "useState<ChatMessage[]>", "useState<BookingChatMessage[]>")
    replace_in_file(page, "import type { Booking, BookingStageRecord as BookingStage, ChatMessage", "import type { Booking, BookingStageRecord as BookingStage, BookingChatMessage")

