## Custom Bonus Points Feature

1. **Notification Persistence and Manual Management**  
   - Locally cache polled notifications in `NotificationsContext` (using `localStorage`), ensuring they persist even after page refreshes;  
   - The notification panel supports unread badges, manual read marking, and per-item dismissal—outperforming basic implementations that display only a single toast notification.

2. **Enhanced Earnings Charts**  
   - While 2.6.1 requires displaying only the last 30 days' earnings, we additionally tag entries by “Today/Number of Days” and transparently show zero income, making it easier for hosts to identify trends.  
   - Chart bars feature gradient heights and provide `title` tooltips, revealing specific amounts on hover.

3. **Multilingual Copy**  
   - Added Chinese descriptions to visitor-facing elements (e.g., search forms, detail pages, booking prompts) for local user comprehension;  
   - Supplemented English tooltips/buttons with Chinese translations to enhance internationalization.

Translated with DeepL.com (free version)