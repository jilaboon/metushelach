# המשחק של סבתא נמרודי

משחק קלפים סולו מובייל־פירסט בהשראת Accordion Solitaire, עם ממשק עברי מלא ו־RTL.

## Architecture overview

- `src/game/engine.ts`: מנוע החוקים הטהור. יצירת משחק, חשיפת קלף, מהלכי חיבור, ביטול מהלך, זיהוי סוף משחק, ניקוד ודירוג.
- `src/hooks/useAppModel.ts`: שכבת האפליקציה. מנהלת מסכים, מצב משחק, שמירה מקומית, סטטיסטיקות, הגדרות וחיווי.
- `src/components/screens/*`: מסכי Splash, בית, משחק והגדרות, יחד עם מודאל תוצאות.
- `src/components/game/*`: רכיבי משחק חוזרים כמו קלף, חפיסה, ערימה, כותרת וחיווי מהלך.
- `src/services/storage.ts`: Persistence מקומי עם AsyncStorage.
- `src/services/feedback.ts`: חיווי הפטי לפי הגדרות המשתמש.
- `src/localization/he.ts`: כל הטקסטים בעברית, מוכן להרחבה לשפות נוספות.

## Folder structure

```text
.
├── App.tsx
├── app.json
├── package.json
├── src
│   ├── AppShell.tsx
│   ├── components
│   │   ├── game
│   │   ├── screens
│   │   └── ui
│   ├── constants
│   ├── game
│   ├── hooks
│   ├── localization
│   ├── services
│   ├── theme
│   └── types
└── README.md
```

## Major game modules

- `createNewGame`: יוצר חפיסה מעורבבת לפי seed ומתחיל משחק חדש.
- `dealNextCard`: חושף קלף ומוסיף אותו כערימה הימנית ביותר.
- `getValidMoves` / `canMove`: בודקים אם אפשר לחבר את הערימה האחרונה לאחת הערימות החוקיות.
- `movePile`: מעביר ערימה שלמה על ערימת יעד.
- `undoMove`: מחזיר מצב קודם דרך היסטוריית snapshots.
- `finalizeIfFinished`: מסמן תום משחק וניצחון מושלם.

## Future extension points

- מערכת רמזים מלאה עם הדגשת מהלך מומלץ.
- אתגר יומי מבוסס seed שמור.
- ערכות קלפים ושולחנות נוספות.
- מסך סטטיסטיקות רחב יותר עם רצפים והיסטוריית משחקים.
- שיתוף תוצאה כתמונה.
- הוספת קבצי סאונד מקוריים ושכבת מוזיקה עדינה.
