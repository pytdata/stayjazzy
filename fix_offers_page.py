import re

with open('/workspace/app-bu4kziuqa9dt/src/pages/OffersPage.tsx', 'r') as f:
    content = f.read()

# Change TIER_CONFIG to handle string index, and remove TierType restriction
content = content.replace(
    "const TIER_CONFIG: Record<TierType, { label: string; cls: string; badgeCls: string }> = {",
    "const TIER_CONFIG: Record<string, { label: string; cls: string; badgeCls: string }> = {"
)

# Replace cfg resolution and add capitalization helper
resolution_logic = """  const cfg = TIER_CONFIG[tier.tier_type.toLowerCase()] || { 
    label: tier.tier_type.charAt(0).toUpperCase() + tier.tier_type.slice(1), 
    cls: 'tier-default', 
    badgeCls: 'bg-primary/10 text-primary border-primary/20' 
  }"""

content = re.sub(
    r'  const cfg = TIER_CONFIG\[tier\.tier_type\]',
    resolution_logic,
    content
)

with open('/workspace/app-bu4kziuqa9dt/src/pages/OffersPage.tsx', 'w') as f:
    f.write(content)
