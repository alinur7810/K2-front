Отличный проект и очень чёткое ТЗ. Давай сразу разберёмся с картинкой от тимлида, зафиксируем контракты с твоими сокомандниками (Бэкенд и Данные) и соберём рабочий, чистый фронтенд в строгом научно-инженерном стиле **NASA Earthdata / SWOT** (без неоновых градиентов, «киберпанка» и прочего ИИ-мусора).

---

## 1. Что даёт картинка от тимлида (инфографика миссии NASA / CSA SWOT)

Тимлид скинул тебе официальный постер спутниковой миссии **SWOT (Surface Water and Ocean Topography)** — совместного проекта NASA и CNES/CSA по спутниковой альтиметрии поверхностных вод. Для твоего фронтенда эта картинка даёт сразу три важные вещи:

1. **Прямая связь с вашими данными (Hydroweb / альтиметрия):**
   Именно данные спутниковой альтиметрии (из которых вы берёте уровни Иссык-Куля, Токтогула и Сон-Куля через Hydroweb) — это то, чем занимается миссия SWOT и её предшественники (Jason, Sentinel-3/6).
2. **Визуальный стиль (NASA Earth Observation):**
   - Глубокий космический тёмно-синий шапки (`#0B1F3A`), гидрологический голубой (`#0284C7`), природный зелёный (`#4D7C0F`) и чистый светлый рабочий фон (`#F4F6F8`) с контрастной типографикой.
   - Никакого фиолетового неона и размытого стекла — всё выглядит как официальный портал **NASA Earthdata / Worldview**.
3. **Идея белых выносок-флажков на карте (Callout Pins):**
   Посмотри, как на картинке над реками, озёрами и ледниками стоят белые таблички на ножках (*«Water volume changes»*, *«River discharge»*). Мы используем этот приём на **Главной карте (Ф5)** и в **Цепочке процессов (Ф4)**: над объектами Кыргызстана (Иссык-Куль, Токтогул, ледник Энильчек, бассейн Нарына) на карте отображаются аккуратные белые бейджи-выноски с направлением и скоростью тренда (`↓ −2.1 см/год`).

---

## 2. Вопросы для согласования с командой (Контрольная точка 1)

По правилам ТЗ (*«Не меняй контракты API молча. Если в ТЗ чего-то не хватает — спроси»*) скинь этот короткий список бэкендеру в общий чат, чтобы зафиксировать формат JSON (в коде ниже они уже поддержаны):

1. **Формат ответа `/api/v1/series`**: договариваемся, что помимо массива `points: [{ date, value, quality }]`, эндпоинт отдаёт и агрегированные годовые точки `yearly_points: [{ year, value }]` (или мы запрашиваем `agg=month` и `agg=year`), чтобы на графике по требованию **Ф3.5** одновременно рисовать и тонкую месячную линию, и жирные годовые точки, по которым шёл тест Манна–Кендалла.
2. **Линия Сена на графике (Ф3.5)**: в таблице `trend_result` (раздел 7) есть `sen_slope` и `intercept`, а в описании `/trend` (раздел 10) перечислены `sen_slope` и `slope_ci`. Просим бэкендера обязательно включить в ответ `/trend` поле `intercept` (и `base_year`, если `intercept` считается относительно первого года ряда, например `y = sen_slope * (year - first_year) + intercept`), чтобы линия тренда на графике ложилась математически точно.
3. **Штатный ответ «Недостаточно данных» (Ф3.1, раздел 10)**: договариваемся, что при `n_years < 10` эндпоинт `/trend` возвращает HTTP `200 OK` с полем `status: "insufficient_data"` (или `trend: "insufficient_data"`), а не HTTP 400/500.

---

## 3. Архитектура и код слоя `frontend/`

Ниже — полный рабочий каркас `frontend/` по всем пунктам **Части 3 (раздел 16 ТЗ)**.
В нём предусмотрен переключатель **`VITE_USE_MOCKS`**:
- По умолчанию на старте хакатона (пока бэкенд поднимает М1) можно включить режим явных заглушек М1 (с заметной плашкой наверху `РЕЖИМ ЗАГЛУШЕК API (М1)` — строго по правилу ТЗ о ненастоящих данных).
- Как только бэкенд поднимает эндпоинты на `/api/v1`, фронтенд работает напрямую с ними.

### Структура папки `frontend/`

```text
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── api.ts              # Строгие контракты API по разделу 10 ТЗ
    ├── i18n/
    │   └── ru.ts               # Все тексты, подсказки к терминам и шаблоны (Ф2.5, раздел 12)
    ├── api/
    │   ├── client.ts           # HTTP-клиент к /api/v1 + обработка ошибок {code, message}
    │   └── mockStubs.ts        # Явно помеченные заглушки М1 для параллельной разработки
    ├── components/
    │   ├── Navbar.tsx          # Шапка в стиле NASA Earthdata / SWOT
    │   ├── TermTooltip.tsx     # Подсказки терминов простыми словами (Ф2.5)
    │   ├── ProxyBadge.tsx      # Маркировка косвенных показателей is_proxy (Ф1.4, раздел 11)
    │   ├── StatusState.tsx     # Состояния: загрузка, нет данных, <10 лет, ошибка сети
    │   ├── TrendBadge.tsx      # Цвет + значок + слово направления и значимости (раздел 11)
    │   ├── TrendChart.tsx      # Научный график: месячный ряд, годовой, линия Сена, пропуски (Ф3.5)
    │   ├── ChainFlow.tsx       # Цепочка связанных переменных со стрелками и Спирменом (Ф4)
    │   └── KyrgyzstanMap.tsx   # Интерактивная карта КР с выносками в стиле SWOT (Ф2.2, Ф5)
    └── pages/
        ├── HomePhenomenaPage.tsx   # Экран 1: Главная — Глобальные явления и карта (Ф5)
        ├── ExploreResultPage.tsx   # Экран 2 и 3: Исследовать + Результат анализа (Ф2, Ф3, Ф4)
        └── ComparePage.tsx         # Экран 4: Сравнение регионов с противоположными трендами (Ф6)
```

---

### Шаг 0. Конфигурация проекта (`package.json`, `vite.config.ts`, `index.css`)

#### `frontend/package.json`
```json
{
  "name": "kg-climate-trends-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5173",
    "build": "tsc && vite build",
    "preview": "vite preview --port 4173"
  },
  "dependencies": {
    "leaflet": "^1.9.4",
    "lucide-react": "^0.454.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "react-router-dom": "^6.27.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.12",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vite": "^5.4.10"
  }
}
```

#### `frontend/vite.config.ts`
Проксируем `/api/v1` на бэкенд (`http://localhost:8000`), чтобы не было проблем с CORS при локальной разработке и в Docker:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

#### `frontend/src/index.css`
Чистая палитра NASA Earth Observation + стили для Leaflet и маркеров-выносок в стиле SWOT:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import 'leaflet/dist/leaflet.css';

:root {
  --nasa-navy: #0B1F3A;
  --nasa-blue: #005288;
  --swot-cyan: #0284C7;
  --bg-surface: #F4F6F8;
}

body {
  margin: 0;
  background-color: var(--bg-surface);
  color: #0F172A;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Public Sans', 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Стиль белых флажков-выносок на карте (референс SWOT Mission) */
.swot-callout-pin {
  background: #ffffff;
  border: 1.5px solid #0B1F3A;
  border-radius: 6px;
  padding: 4px 8px;
  box-shadow: 0 3px 8px rgba(11, 31, 58, 0.18);
  font-size: 11px;
  font-weight: 600;
  color: #0F172A;
  white-space: nowrap;
  position: relative;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.swot-callout-pin:hover {
  transform: translateY(-2px);
  border-color: #0284C7;
}

.swot-callout-pin::after {
  content: '';
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 7px 6px 0;
  border-style: solid;
  border-color: #0B1F3A transparent;
  display: block;
  width: 0;
}
```

---

### Шаг 1. Типы контрактов API (`src/types/api.ts`) и Словарь (`src/i18n/ru.ts`)

#### `frontend/src/types/api.ts`
```ts
export type SectionCode = 'water' | 'glaciers' | 'climate' | 'vegetation';
export type ObjectType = 'lake' | 'reservoir' | 'river_basin' | 'glacier' | 'region' | 'point' | 'global';
export type ObservationQuality = 'ok' | 'filled' | 'outlier';
export type TrendDirection = 'increasing' | 'decreasing' | 'no_trend' | 'weak_increasing' | 'weak_decreasing' | 'insufficient_data';
export type ChainLinkStatus = 'confirmed' | 'unconfirmed' | 'no_data';

export interface ApiErrorShape {
  code: string;
  message: string;
}

export interface SectionDto {
  code: SectionCode;
  name: string;
  order: number;
  description?: string;
}

export interface GeoObjectDto {
  code: string;
  type: ObjectType;
  name: string;
  parent?: string | null;
  marker: [number, number]; // [lat, lon] WGS84
  geom?: GeoJSON.Geometry | null;
}

export interface VariableDto {
  code: string;
  section: SectionCode;
  name: string;
  unit: string;
  yearly_agg: 'mean' | 'sum' | 'max';
  season_months?: number[] | null;
  direction_note?: string | null;
  is_proxy?: boolean;
  proxy_explanation?: string | null;
  available_from?: number;
  available_to?: number;
}

export interface SourceMetaDto {
  code: string;
  name: string;
  dataset_id: string;
  url: string;
  license: string;
  citation: string;
  spatial_resolution?: string;
}

export interface ObservationPointDto {
  date: string; // YYYY-MM-01
  value: number | null;
  quality: ObservationQuality;
}

export interface YearlyPointDto {
  year: number;
  value: number | null;
  valid_months?: number;
}

export interface SeriesResponseDto {
  object_code: string;
  object_name: string;
  variable_code: string;
  variable_name: string;
  unit: string;
  yearly_agg: 'mean' | 'sum' | 'max';
  date_from: string;
  date_to: string;
  is_proxy: boolean;
  proxy_note?: string | null;
  missing_share: number; // 0..1
  filled_share: number;  // 0..1
  outlier_share: number; // 0..1
  source: SourceMetaDto;
  monthly: ObservationPointDto[];
  yearly: YearlyPointDto[];
}

export interface TrendResponseDto {
  status: 'ok' | 'insufficient_data';
  object_code: string;
  object_name: string;
  variable_code: string;
  variable_name: string;
  from_year: number;
  to_year: number;
  trend: TrendDirection;
  p_value: number | null;
  tau: number | null;
  sen_slope: number | null; // ед./год
  slope_ci: [number, number] | null; // 95% ДИ
  intercept: number | null;
  base_year: number;
  unit: string;
  n_years: number;
  method: string; // 'Mann-Kendall' | 'Hamed-Rao Modified Mann-Kendall'
  missing_share: number;
  is_proxy: boolean;
  proxy_note?: string | null;
  summary_text: string;
  source: SourceMetaDto;
  computed_at?: string;
}

export interface ChainLinkDto {
  order: number;
  variable_code: string;
  variable_name: string;
  unit: string;
  is_proxy: boolean;
  expected_relation: '+' | '-';
  explanation_text: string;
  status: ChainLinkStatus;
  trend: TrendDirection;
  sen_slope: number | null;
  p_value: number | null;
  spearman_r_prev: number | null; // корреляция Спирмена с предыдущим звеном
  spearman_p_prev: number | null;
  yearly_sparkline: YearlyPointDto[];
}

export interface ChainResponseDto {
  section: SectionCode;
  object_code: string;
  object_name: string;
  target_variable: string;
  from_year: number;
  to_year: number;
  chain_name: string;
  summary_caution_text: string;
  links: ChainLinkDto[];
}

export interface PhenomenonDto {
  code: string;
  name: string;
  description: string;
  global_variable_name: string;
  global_unit: string;
}

export interface PhenomenonMapObjectDto {
  object_code: string;
  object_name: string;
  object_type: ObjectType;
  marker: [number, number];
  local_variable_code: string;
  local_variable_name: string;
  unit: string;
  trend: TrendDirection;
  sen_slope: number | null;
  normalized_slope: number; // -1..1 для размера/яркости маркера
  p_value: number | null;
  is_significant: boolean;
  short_note: string;
}

export interface PhenomenonMapResponseDto {
  phenomenon: PhenomenonDto;
  from_year: number;
  to_year: number;
  objects: PhenomenonMapObjectDto[];
}

export interface PhenomenonObjectDetailDto {
  phenomenon: PhenomenonDto;
  object_code: string;
  object_name: string;
  from_year: number;
  to_year: number;
  explanation_note: string;
  local_series: YearlyPointDto[];
  local_trend: TrendResponseDto;
  global_series: YearlyPointDto[];
  global_trend: TrendResponseDto;
}

export interface ComparePairResponseDto {
  variable_code: string;
  variable_name: string;
  unit: string;
  from_year: number;
  to_year: number;
  selection_mode: 'opposite_significant' | 'fastest_vs_most_stable' | 'manual';
  comparison_summary: string;
  object_a: {
    series: SeriesResponseDto;
    trend: TrendResponseDto;
  };
  object_b: {
    series: SeriesResponseDto;
    trend: TrendResponseDto;
  };
}

export interface ObjectTrendTableRowDto {
  object_code: string;
  object_name: string;
  object_type: ObjectType;
  trend: TrendDirection;
  sen_slope: number | null;
  p_value: number | null;
  tau: number | null;
  n_years: number;
  unit: string;
}
```

#### `frontend/src/i18n/ru.ts`
Все строки интерфейса и простые объяснения научных терминов (требование **Ф2.5** и **раздела 12**):
```ts
export const RU = {
  appTitle: 'Кыргызстан: Детектив климатических трендов',
  appSubtitle: 'Спутниковый мониторинг водных, гляциологических и климатических изменений • NASA Space Apps 2026',
  nav: {
    homeMap: 'Глобальные явления и карта',
    explore: 'Исследовать объект',
    compare: 'Сравнение регионов',
  },
  steps: {
    section: '1. Раздел системы Земли',
    place: '2. Объект, регион или точка',
    variable: '3. Спутниковый параметр',
    period: '4. Период наблюдения',
  },
  placeModes: {
    object: 'Водный / природный объект',
    region: 'Область КР',
    point: 'Точка на карте (сетка)',
  },
  trendLabels: {
    increasing: 'Рост',
    decreasing: 'Снижение',
    weak_increasing: 'Слабые признаки роста',
    weak_decreasing: 'Слабые признаки снижения',
    no_trend: 'Тренда нет',
    insufficient_data: 'Недостаточно данных',
  },
  significanceLabels: {
    confident: 'Уверенный (p < 0,05)',
    weak: 'Слабый (0,05 ≤ p < 0,10)',
    none: 'Не выявлен (p ≥ 0,10)',
  },
  chainStatuses: {
    confirmed: 'Подтверждается',
    unconfirmed: 'Не подтверждается',
    no_data: 'Нет данных',
  },
  terms: {
    trend: {
      title: 'Климатический тренд',
      text: 'Устойчивое однонаправленное изменение показателя за длительный период (минимум 10 лет), очищенное от сезонных колебаний.',
    },
    p_value: {
      title: 'Статистическая значимость (p-value)',
      text: 'Вероятность того, что наблюдаемый рост или спад возник случайно из-за природного шума. При p < 0,05 вероятность случайности меньше 5 % — тренд считается статистически значимым.',
    },
    sen_slope: {
      title: 'Наклон Сена (Sen’s slope)',
      text: 'Устойчивая к выбросам оценка средней скорости изменения показателя в год (медиана наклонов между всеми парами годовых точек).',
    },
    tau: {
      title: 'Тау Кендалла (τ)',
      text: 'Показатель монотонности тренда от −1 до +1. Показывает, насколько последовательно год за годом значения растут (+) или снижаются (−).',
    },
    hamed_rao: {
      title: 'Модификация Хамеда–Рао',
      text: 'Поправка к тесту Манна–Кендалла, которая применяется автоматически, если соседние годы зависят друг от друга (автокорреляция), чтобы избежать ложных выводов.',
    },
    proxy: {
      title: 'Косвенный показатель (Proxy)',
      text: 'Спутники не измеряют массу льда отдельного малого ледника или расход воды в горной реке напрямую. Вместо этого используется связанный спутниковый или модельный показатель (например, площадь снежного покрова MODIS или модельный сток GLDAS).',
    },
    spearman: {
      title: 'Ранговая корреляция Спирмена (rₛ)',
      text: 'Показывает, насколько синхронно изменяются два соседних звена цепочки по годам (от −1 до +1). Наличие корреляции указывает на согласованность процессов, но само по себе не доказывает прямую причинность.',
    },
  },
  cautionChainBanner:
    'Примечание: цепочка отражает статистическую согласованность трендов за выбранный период по данным дистанционного зондирования и не является прямым доказательством причинно-следственной связи.',
};
```

---

### Шаг 2. Слой API (`src/api/client.ts`) и заглушки М1 (`src/api/mockStubs.ts`)

Клиент строго обращается к `/api/v1/...`, не ходит ни в какие внешние API NASA и поддерживает режим заглушек М1 для независимой разработки фронтенда.

#### `frontend/src/api/mockStubs.ts`
```ts
/**
 * ВНИМАНИЕ: ЭТО ЗАГЛУШКИ МОДУЛЯ М1 ДЛЯ ОТЛАДКИ ИНТЕРФЕЙСА ДО ГОТОВНОСТИ БД.
 * В соответствии с ТЗ они явно помечены и отключаются при работе с реальным бэкендом.
 */
import {
  ChainResponseDto,
  ComparePairResponseDto,
  GeoObjectDto,
  ObjectTrendTableRowDto,
  PhenomenonDto,
  PhenomenonMapResponseDto,
  PhenomenonObjectDetailDto,
  SectionDto,
  SeriesResponseDto,
  TrendResponseDto,
  VariableDto,
} from '../types/api';

export const MOCK_SECTIONS: SectionDto[] = [
  { code: 'water', name: 'Вода и гидрология', order: 1, description: 'Уровень озёр, водохранилищ и речной сток' },
  { code: 'glaciers', name: 'Ледники и снег', order: 2, description: 'Снежный покров MODIS, снегозапас SWE и температура ледников' },
  { code: 'climate', name: 'Климат и атмосфера', order: 3, description: 'Температура воздуха, осадки и влажность почвы' },
  { code: 'vegetation', name: 'Растительность', order: 4, description: 'Индекс вегетации NDVI за апрель–сентябрь' },
];

export const MOCK_OBJECTS: GeoObjectDto[] = [
  { code: 'issyk_kul', type: 'lake', name: 'Озеро Иссык-Куль', marker: [42.45, 77.25] },
  { code: 'son_kul', type: 'lake', name: 'Озеро Сон-Куль', marker: [41.83, 75.13] },
  { code: 'chatyr_kul', type: 'lake', name: 'Озеро Чатыр-Куль', marker: [40.61, 75.31] },
  { code: 'toktogul', type: 'reservoir', name: 'Токтогульское водохранилище', marker: [41.78, 72.82] },
  { code: 'naryn_basin', type: 'river_basin', name: 'Бассейн реки Нарын', marker: [41.45, 75.95] },
  { code: 'chu_basin', type: 'river_basin', name: 'Бассейн реки Чу', marker: [42.82, 74.58] },
  { code: 'enilchek', type: 'glacier', name: 'Ледник Энильчек (Иныльчек)', marker: [42.16, 79.92] },
  { code: 'petrova', type: 'glacier', name: 'Ледник Петрова', marker: [41.89, 78.23] },
  { code: 'ak_shiyrak', type: 'glacier', name: 'Массив Ак-Шыйрак', marker: [41.81, 78.18] },
  { code: 'golubina', type: 'glacier', name: 'Ледник Голубина (Ала-Арча)', marker: [42.46, 74.49] },
  { code: 'issyk_kul_reg', type: 'region', name: 'Иссык-Кульская область', marker: [42.18, 77.55] },
  { code: 'naryn_reg', type: 'region', name: 'Нарынская область', marker: [41.42, 75.99] },
  { code: 'chuy_reg', type: 'region', name: 'Чуйская область', marker: [42.75, 74.45] },
  { code: 'osh_reg', type: 'region', name: 'Ошская область', marker: [40.32, 72.95] },
  { code: 'jalal_abad_reg', type: 'region', name: 'Джалал-Абадская область', marker: [41.35, 72.45] },
  { code: 'batken_reg', type: 'region', name: 'Баткенская область', marker: [39.92, 70.82] },
  { code: 'talas_reg', type: 'region', name: 'Таласская область', marker: [42.48, 72.22] },
];

export const MOCK_VARIABLES: VariableDto[] = [
  {
    code: 'water_level',
    section: 'water',
    name: 'Уровень водной поверхности (альтиметрия)',
    unit: 'м',
    yearly_agg: 'mean',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'runoff_mod',
    section: 'water',
    name: 'Поверхностный сток (модельный)',
    unit: 'мм/год',
    yearly_agg: 'sum',
    is_proxy: true,
    proxy_explanation: 'Прямого спутникового ряда расхода воды нет; используется модельный сток NASA GLDAS Noah по контуру бассейна.',
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'tws_grace',
    section: 'water',
    name: 'Аномалия общих запасов воды суши (TWS)',
    unit: 'см',
    yearly_agg: 'mean',
    is_proxy: false,
    available_from: 2002,
    available_to: 2025,
  },
  {
    code: 'evaporation',
    section: 'water',
    name: 'Суммарное испарение',
    unit: 'мм/год',
    yearly_agg: 'sum',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'snow_cover_frac',
    section: 'glaciers',
    name: 'Доля снежного покрова в контуре ледника',
    unit: '%',
    yearly_agg: 'mean',
    is_proxy: true,
    proxy_explanation: 'Косвенный показатель состояния ледника (MODIS MOD10A1) вместо прямого измерения баланса массы льда.',
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'swe_max',
    section: 'glaciers',
    name: 'Максимальный снегозапас (SWE)',
    unit: 'мм',
    yearly_agg: 'max',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'air_temp',
    section: 'climate',
    name: 'Температура приземного воздуха',
    unit: '°C',
    yearly_agg: 'mean',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'precipitation',
    section: 'climate',
    name: 'Годовая сумма осадков',
    unit: 'мм/год',
    yearly_agg: 'sum',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'ndvi_veg',
    section: 'vegetation',
    name: 'Индекс вегетации NDVI (апр–сент)',
    unit: 'индекс',
    yearly_agg: 'mean',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
];

export function buildMockSeriesAndTrend(
  objectCode: string,
  variableCode: string,
  fromYear: number,
  toYear: number
): { series: SeriesResponseDto; trend: TrendResponseDto } {
  const obj = MOCK_OBJECTS.find((o) => o.code === objectCode) || {
    code: objectCode,
    name: objectCode.startsWith('pt_') ? `Точка (${objectCode.replace('pt_', '')})` : objectCode,
    type: 'point' as const,
    marker: [41.5, 75.0] as [number, number],
  };
  const variable = MOCK_VARIABLES.find((v) => v.code === variableCode) || MOCK_VARIABLES[0];

  const yearsCount = Math.max(0, toYear - fromYear + 1);
  const yearly = [];
  const monthly = [];

  // Настройки для эталонного сценария Иссык-Куля и других объектов в режиме заглушки М1
  const isDecreasing =
    variableCode === 'water_level' || variableCode === 'snow_cover_frac' || objectCode === 'batken_reg';
  const baseVal =
    variableCode === 'water_level'
      ? 1606.85
      : variableCode === 'air_temp'
      ? 6.4
      : variableCode === 'precipitation'
      ? 360
      : variableCode === 'snow_cover_frac'
      ? 74.0
      : 120.0;
  const slopePerYear =
    variableCode === 'water_level'
      ? -0.022
      : variableCode === 'air_temp'
      ? 0.048
      : variableCode === 'precipitation'
      ? objectCode === 'chuy_reg'
        ? 2.4
        : -2.8
      : isDecreasing
      ? -0.45
      : 0.35;

  for (let y = fromYear; y <= toYear; y++) {
    const idx = y - fromYear;
    const deterministicWave = Math.sin(idx * 1.3) * (Math.abs(slopePerYear) * 1.4);
    const yVal = Number((baseVal + slopePerYear * idx + deterministicWave).toFixed(3));
    yearly.push({
      year: y,
      value: y === 2017 && variableCode === 'tws_grace' ? null : yVal,
      valid_months: y === 2017 && variableCode === 'tws_grace' ? 4 : 12,
    });

    for (let m = 1; m <= 12; m++) {
      const mStr = String(m).padStart(2, '0');
      const seasonal = Math.sin(((m - 3) / 12) * Math.PI * 2) * (Math.abs(slopePerYear) * 3.5);
      const isFilled = y === 2012 && m === 7;
      const isOutlier = y === 2019 && m === 11;
      monthly.push({
        date: `${y}-${mStr}-01`,
        value: Number((yVal + seasonal).toFixed(3)),
        quality: isOutlier ? ('outlier' as const) : isFilled ? ('filled' as const) : ('ok' as const),
      });
    }
  }

  const validYears = yearly.filter((p) => p.value !== null).length;
  const isInsufficient = validYears < 10;

  const source =
    variableCode === 'water_level'
      ? {
          code: 'hydroweb',
          name: 'Hydroweb.next (Theia / CNES)',
          dataset_id: 'HYDROWEB_LAKES_OPE_V2',
          url: 'https://hydroweb.next.theia-land.fr/',
          license: 'Etalab Open Licence 2.0',
          citation: 'Crétaux et al., LEGOS/CNES Hydroweb Satellite Altimetry Database',
          spatial_resolution: 'Трек спутникового альтиметра',
        }
      : {
          code: 'gldas',
          name: 'NASA GLDAS Noah v2.1 (GES DISC)',
          dataset_id: 'GLDAS_NOAH025_M_2.1',
          url: 'https://disc.gsfc.nasa.gov/',
          license: 'NASA Open Data Policy',
          citation: 'Rodell et al. (2004), The Global Land Data Assimilation System, BAMS',
          spatial_resolution: '0.25° × 0.25° (EPSG:4326)',
        };

  const series: SeriesResponseDto = {
    object_code: obj.code,
    object_name: obj.name,
    variable_code: variable.code,
    variable_name: variable.name,
    unit: variable.unit,
    yearly_agg: variable.yearly_agg,
    date_from: `${fromYear}-01-01`,
    date_to: `${toYear}-12-01`,
    is_proxy: Boolean(variable.is_proxy),
    proxy_note: variable.proxy_explanation || null,
    missing_share: 0.015,
    filled_share: 0.012,
    outlier_share: 0.004,
    source,
    monthly,
    yearly,
  };

  if (isInsufficient) {
    return {
      series,
      trend: {
        status: 'insufficient_data',
        object_code: obj.code,
        object_name: obj.name,
        variable_code: variable.code,
        variable_name: variable.name,
        from_year: fromYear,
        to_year: toYear,
        trend: 'insufficient_data',
        p_value: null,
        tau: null,
        sen_slope: null,
        slope_ci: null,
        intercept: null,
        base_year: fromYear,
        unit: variable.unit,
        n_years: validYears,
        method: 'Тест не выполнялся (минимум 10 валидных лет по Ф3.1)',
        missing_share: 0.015,
        is_proxy: Boolean(variable.is_proxy),
        proxy_note: variable.proxy_explanation || null,
        summary_text: `За выбранный период (${fromYear}–${toYear} гг.) доступно только ${validYears} лет наблюдений. Для статистически корректного теста Манна–Кендалла требуется минимум 10 валидных лет.`,
        source,
      },
    };
  }

  const totalChange = Number((slopePerYear * (validYears - 1)).toFixed(2));
  const directionWord = slopePerYear < 0 ? 'снижается' : 'растёт';

  const trend: TrendResponseDto = {
    status: 'ok',
    object_code: obj.code,
    object_name: obj.name,
    variable_code: variable.code,
    variable_name: variable.name,
    from_year: fromYear,
    to_year: toYear,
    trend: slopePerYear < 0 ? 'decreasing' : 'increasing',
    p_value: 0.0034,
    tau: slopePerYear < 0 ? -0.58 : 0.61,
    sen_slope: slopePerYear,
    slope_ci: [Number((slopePerYear * 1.25).toFixed(4)), Number((slopePerYear * 0.75).toFixed(4))].sort(
      (a, b) => a - b
    ) as [number, number],
    intercept: baseVal,
    base_year: fromYear,
    unit: variable.unit,
    n_years: validYears,
    method: 'Hamed-Rao Modified Mann-Kendall (pymannkendall)',
    missing_share: 0.015,
    is_proxy: Boolean(variable.is_proxy),
    proxy_note: variable.proxy_explanation || null,
    summary_text: `[ЗАГЛУШКА М1] Показатель «${variable.name}» (${obj.name}) за ${fromYear}–${toYear} годы ${directionWord} в среднем на ${Math.abs(
      slopePerYear
    )} ${variable.unit} в год. Тренд статистически значим (p = 0,0034): вероятность случайности меньше 5 %. За весь период накопленное изменение составило около ${Math.abs(
      totalChange
    )} ${variable.unit}.`,
    source,
  };

  return { series, trend };
}

export function buildMockChain(objectCode: string, variableCode: string, fromYear: number, toYear: number): ChainResponseDto {
  const mkSpark = (base: number, slope: number) =>
    Array.from({ length: Math.max(5, toYear - fromYear + 1) }, (_, i) => ({
      year: fromYear + i,
      value: Number((base + slope * i + Math.sin(i * 1.2) * Math.abs(slope)).toFixed(2)),
    }));

  return {
    section: 'water',
    object_code: objectCode,
    object_name: MOCK_OBJECTS.find((o) => o.code === objectCode)?.name || objectCode,
    target_variable: variableCode,
    from_year: fromYear,
    to_year: toYear,
    chain_name: 'Гидрологический баланс бессточного горного озера',
    summary_caution_text:
      '[ЗАГЛУШКА М1] Наблюдаемое снижение уровня озера согласуется с ростом температуры воздуха и увеличением потерь на испарение в пределах бассейна при сокращении сезонного снегозапаса.',
    links: [
      {
        order: 1,
        variable_code: 'air_temp',
        variable_name: 'Температура воздуха',
        unit: '°C',
        is_proxy: false,
        expected_relation: '+',
        explanation_text: 'Рост приземной температуры в бассейне ускоряет таяние и повышает потенциал испарения.',
        status: 'confirmed',
        trend: 'increasing',
        sen_slope: 0.048,
        p_value: 0.0021,
        spearman_r_prev: null,
        spearman_p_prev: null,
        yearly_sparkline: mkSpark(6.2, 0.048),
      },
      {
        order: 2,
        variable_code: 'swe_max',
        variable_name: 'Снегозапас (SWE)',
        unit: 'мм',
        is_proxy: false,
        expected_relation: '-',
        explanation_text: 'Снижение максимального зимнего снегозапаса уменьшает весенне-летнюю подпитку рек.',
        status: 'confirmed',
        trend: 'decreasing',
        sen_slope: -1.35,
        p_value: 0.018,
        spearman_r_prev: -0.62,
        spearman_p_prev: 0.004,
        yearly_sparkline: mkSpark(145, -1.35),
      },
      {
        order: 3,
        variable_code: 'runoff_mod',
        variable_name: 'Сток в бассейне (модельный)',
        unit: 'мм/год',
        is_proxy: true,
        expected_relation: '-',
        explanation_text: 'Модельный поверхностный сток GLDAS не показывает значимого роста, способного компенсировать испарение.',
        status: 'unconfirmed',
        trend: 'no_trend',
        sen_slope: -0.42,
        p_value: 0.24,
        spearman_r_prev: 0.54,
        spearman_p_prev: 0.012,
        yearly_sparkline: mkSpark(210, -0.42),
      },
      {
        order: 4,
        variable_code: 'evaporation',
        variable_name: 'Испарение с поверхности',
        unit: 'мм/год',
        is_proxy: false,
        expected_relation: '+',
        explanation_text: 'Рост суммарного испарения согласуется с повышением температуры воздуха и воды.',
        status: 'confirmed',
        trend: 'increasing',
        sen_slope: 2.15,
        p_value: 0.009,
        spearman_r_prev: -0.48,
        spearman_p_prev: 0.029,
        yearly_sparkline: mkSpark(680, 2.15),
      },
      {
        order: 5,
        variable_code: 'water_level',
        variable_name: 'Уровень воды озера',
        unit: 'м',
        is_proxy: false,
        expected_relation: '-',
        explanation_text: 'Результирующий водный баланс проявляется в устойчивом снижении уровня по данным альтиметрии.',
        status: 'confirmed',
        trend: 'decreasing',
        sen_slope: -0.022,
        p_value: 0.0034,
        spearman_r_prev: -0.71,
        spearman_p_prev: 0.0008,
        yearly_sparkline: mkSpark(1606.85, -0.022),
      },
    ],
  };
}

export const MOCK_PHENOMENA: PhenomenonDto[] = [
  {
    code: 'global_warming',
    name: 'Глобальное потепление',
    description: 'Связь глобальной аномалии температуры (NOAA GlobalTemp) с водным балансом озёр, водохранилищ и деградацией снежно-ледникового покрова Кыргызстана.',
    global_variable_name: 'Аномалия глобальной температуры (NOAA)',
    global_unit: '°C',
  },
  {
    code: 'precip_regime_shift',
    name: 'Изменение режима осадков и засушливости',
    description: 'Пространственная неоднородность трендов увлажнения между Северным и Юго-Западным Кыргызстаном по данным GPM IMERG и GLDAS.',
    global_variable_name: 'Концентрация CO₂ Мауна-Лоа (NOAA GML)',
    global_unit: 'ppm',
  },
];

export function buildMockPhenomenonMap(code: string, fromYear: number, toYear: number): PhenomenonMapResponseDto {
  const phenomenon = MOCK_PHENOMENA.find((p) => p.code === code) || MOCK_PHENOMENA[0];
  return {
    phenomenon,
    from_year: fromYear,
    to_year: toYear,
    objects: [
      {
        object_code: 'issyk_kul',
        object_name: 'Озеро Иссык-Куль',
        object_type: 'lake',
        marker: [42.45, 77.25],
        local_variable_code: 'water_level',
        local_variable_name: 'Уровень воды',
        unit: 'м',
        trend: 'decreasing',
        sen_slope: -0.022,
        normalized_slope: -0.82,
        p_value: 0.0034,
        is_significant: true,
        short_note: 'Снижение уровня на фоне роста испарения',
      },
      {
        object_code: 'toktogul',
        object_name: 'Токтогульское вдхр.',
        object_type: 'reservoir',
        marker: [41.78, 72.82],
        local_variable_code: 'water_level',
        local_variable_name: 'Уровень водохранилища',
        unit: 'м',
        trend: 'decreasing',
        sen_slope: -0.38,
        normalized_slope: -0.74,
        p_value: 0.014,
        is_significant: true,
        short_note: 'Высокая межгодовая изменчивость и сработка',
      },
      {
        object_code: 'enilchek',
        object_name: 'Ледник Энильчек',
        object_type: 'glacier',
        marker: [42.16, 79.92],
        local_variable_code: 'snow_cover_frac',
        local_variable_name: 'Доля снежного покрова (proxy)',
        unit: '%',
        trend: 'decreasing',
        sen_slope: -0.45,
        normalized_slope: -0.88,
        p_value: 0.0019,
        is_significant: true,
        short_note: 'Сокращение летнего снежного покрова в контуре RGI',
      },
      {
        object_code: 'golubina',
        object_name: 'Ледник Голубина',
        object_type: 'glacier',
        marker: [42.46, 74.49],
        local_variable_code: 'snow_cover_frac',
        local_variable_name: 'Доля снежного покрова (proxy)',
        unit: '%',
        trend: 'decreasing',
        sen_slope: -0.52,
        normalized_slope: -0.91,
        p_value: 0.0011,
        is_significant: true,
        short_note: 'Устойчивое снижение площади сезонного снега',
      },
      {
        object_code: 'naryn_basin',
        object_name: 'Бассейн р. Нарын',
        object_type: 'river_basin',
        marker: [41.45, 75.95],
        local_variable_code: 'air_temp',
        local_variable_name: 'Температура воздуха',
        unit: '°C',
        trend: 'increasing',
        sen_slope: 0.051,
        normalized_slope: 0.85,
        p_value: 0.0015,
        is_significant: true,
        short_note: 'Уверенный рост среднегодовой температуры',
      },
      {
        object_code: 'son_kul',
        object_name: 'Озеро Сон-Куль',
        object_type: 'lake',
        marker: [41.83, 75.13],
        local_variable_code: 'water_level',
        local_variable_name: 'Уровень воды',
        unit: 'м',
        trend: 'no_trend',
        sen_slope: -0.004,
        normalized_slope: -0.18,
        p_value: 0.31,
        is_significant: false,
        short_note: 'Статистически значимый тренд не выявлен',
      },
    ],
  };
}

export function buildMockPhenomenonObjectDetail(
  code: string,
  objectCode: string,
  fromYear: number,
  toYear: number
): PhenomenonObjectDetailDto {
  const mapData = buildMockPhenomenonMap(code, fromYear, toYear);
  const target = mapData.objects.find((o) => o.object_code === objectCode) || mapData.objects[0];
  const local = buildMockSeriesAndTrend(target.object_code, target.local_variable_code, fromYear, toYear);

  const globalSeries = Array.from({ length: Math.max(1, toYear - fromYear + 1) }, (_, i) => ({
    year: fromYear + i,
    value: Number((0.52 + 0.024 * i + Math.sin(i * 1.5) * 0.05).toFixed(3)),
  }));

  return {
    phenomenon: mapData.phenomenon,
    object_code: target.object_code,
    object_name: target.object_name,
    from_year: fromYear,
    to_year: toYear,
    explanation_note: `[ЗАГЛУШКА М1] Изменение показателя «${target.local_variable_name}» на объекте «${target.object_name}» за ${fromYear}–${toYear} гг. согласуется с ростом глобальной температурной аномалии NOAA GlobalTemp (+0,024 °C/год).`,
    local_series: local.series.yearly,
    local_trend: local.trend,
    global_series: globalSeries,
    global_trend: {
      ...local.trend,
      object_code: 'global',
      object_name: 'Земной шар (NOAA GlobalTemp)',
      variable_code: 'noaa_global_temp',
      variable_name: mapData.phenomenon.global_variable_name,
      unit: mapData.phenomenon.global_unit,
      trend: 'increasing',
      sen_slope: 0.024,
      p_value: 0.0001,
    },
  };
}

export function buildMockCompare(
  variableCode: string,
  objectA: string,
  objectB: string,
  fromYear: number,
  toYear: number,
  isAuto: boolean
): ComparePairResponseDto {
  const aData = buildMockSeriesAndTrend(objectA, variableCode, fromYear, toYear);
  const bData = buildMockSeriesAndTrend(objectB, variableCode, fromYear, toYear);

  // Делаем противоположные наклоны для демонстрации Ф6
  aData.trend.trend = 'increasing';
  aData.trend.sen_slope = 2.45;
  bData.trend.trend = 'decreasing';
  bData.trend.sen_slope = -2.85;

  return {
    variable_code: variableCode,
    variable_name: aData.series.variable_name,
    unit: aData.series.unit,
    from_year: fromYear,
    to_year: toYear,
    selection_mode: isAuto ? 'opposite_significant' : 'manual',
    comparison_summary: `[ЗАГЛУШКА М1] Противоположные значимые тренды за ${fromYear}–${toYear} гг.: в объекте «${aData.series.object_name}» показатель растёт (+2,45 ${aData.series.unit}/год), тогда как в объекте «${bData.series.object_name}» снижается (−2,85 ${bData.series.unit}/год).`,
    object_a: aData,
    object_b: bData,
  };
}

export function buildMockTrendsTable(variableCode: string): ObjectTrendTableRowDto[] {
  const variable = MOCK_VARIABLES.find((v) => v.code === variableCode) || MOCK_VARIABLES[0];
  return [
    { object_code: 'chuy_reg', object_name: 'Чуйская область', object_type: 'region', trend: 'increasing', sen_slope: 2.45, p_value: 0.012, tau: 0.44, n_years: 26, unit: variable.unit },
    { object_code: 'issyk_kul_reg', object_name: 'Иссык-Кульская область', object_type: 'region', trend: 'increasing', sen_slope: 1.82, p_value: 0.028, tau: 0.39, n_years: 26, unit: variable.unit },
    { object_code: 'naryn_reg', object_name: 'Нарынская область', object_type: 'region', trend: 'no_trend', sen_slope: 0.35, p_value: 0.48, tau: 0.11, n_years: 26, unit: variable.unit },
    { object_code: 'talas_reg', object_name: 'Таласская область', object_type: 'region', trend: 'weak_decreasing', sen_slope: -1.15, p_value: 0.074, tau: -0.28, n_years: 26, unit: variable.unit },
    { object_code: 'osh_reg', object_name: 'Ошская область', object_type: 'region', trend: 'decreasing', sen_slope: -2.10, p_value: 0.019, tau: -0.41, n_years: 26, unit: variable.unit },
    { object_code: 'batken_reg', object_name: 'Баткенская область', object_type: 'region', trend: 'decreasing', sen_slope: -2.85, p_value: 0.004, tau: -0.53, n_years: 26, unit: variable.unit },
  ];
}
```

#### `frontend/src/api/client.ts`
```ts
import {
  ApiErrorShape,
  ChainResponseDto,
  ComparePairResponseDto,
  GeoObjectDto,
  ObjectTrendTableRowDto,
  PhenomenonDto,
  PhenomenonMapResponseDto,
  PhenomenonObjectDetailDto,
  SectionDto,
  SeriesResponseDto,
  TrendResponseDto,
  VariableDto,
} from '../types/api';
import {
  buildMockChain,
  buildMockCompare,
  buildMockPhenomenonMap,
  buildMockPhenomenonObjectDetail,
  buildMockSeriesAndTrend,
  buildMockTrendsTable,
  MOCK_OBJECTS,
  MOCK_PHENOMENA,
  MOCK_SECTIONS,
  MOCK_VARIABLES,
} from './mockStubs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Управление режимом заглушек М1 (по умолчанию включено, если бэкенд ещё не запущен, и переключается в шапке)
let useMocksMode = (import.meta.env.VITE_USE_MOCKS ?? 'true') === 'true';

export function getUseMocksMode(): boolean {
  return useMocksMode;
}

export function setUseMocksMode(val: boolean): void {
  useMocksMode = val;
}

export class ApiClientError extends Error {
  code: string;
  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.code = shape.code;
  }
}

async function requestJson<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message: 'Не удалось соединиться с сервером API (/api/v1). Проверьте, запущен ли контейнер backend.',
    });
  }

  if (!response.ok) {
    let errBody: ApiErrorShape = {
      code: `HTTP_${response.status}`,
      message: `Ошибка ответа сервера (${response.status})`,
    };
    try {
      const parsed = await response.json();
      if (parsed && parsed.code && parsed.message) {
        errBody = parsed;
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiClientError(errBody);
  }

  return (await response.json()) as T;
}

export const apiClient = {
  async getSections(): Promise<SectionDto[]> {
    if (useMocksMode) return MOCK_SECTIONS;
    return requestJson<SectionDto[]>('/sections');
  },

  async getObjects(section?: string, type?: string): Promise<GeoObjectDto[]> {
    if (useMocksMode) {
      return MOCK_OBJECTS.filter((o) => !type || o.type === type);
    }
    return requestJson<GeoObjectDto[]>('/objects', { section, type });
  },

  async getVariables(section?: string, object?: string): Promise<VariableDto[]> {
    if (useMocksMode) {
      return MOCK_VARIABLES.filter((v) => !section || v.section === section);
    }
    return requestJson<VariableDto[]>('/variables', { section, object });
  },

  async getSeries(params: {
    object?: string;
    lat?: number;
    lon?: number;
    variable: string;
    from: number;
    to: number;
  }): Promise<SeriesResponseDto> {
    if (useMocksMode) {
      const code = params.object || `pt_${params.lat?.toFixed(2)}_${params.lon?.toFixed(2)}`;
      return buildMockSeriesAndTrend(code, params.variable, params.from, params.to).series;
    }
    return requestJson<SeriesResponseDto>('/series', params);
  },

  async getTrend(params: {
    object?: string;
    lat?: number;
    lon?: number;
    variable: string;
    from: number;
    to: number;
  }): Promise<TrendResponseDto> {
    if (useMocksMode) {
      const code = params.object || `pt_${params.lat?.toFixed(2)}_${params.lon?.toFixed(2)}`;
      return buildMockSeriesAndTrend(code, params.variable, params.from, params.to).trend;
    }
    return requestJson<TrendResponseDto>('/trend', params);
  },

  async getChain(params: {
    object: string;
    variable: string;
    from: number;
    to: number;
  }): Promise<ChainResponseDto> {
    if (useMocksMode) {
      return buildMockChain(params.object, params.variable, params.from, params.to);
    }
    return requestJson<ChainResponseDto>('/chain', params);
  },

  async getPhenomena(): Promise<PhenomenonDto[]> {
    if (useMocksMode) return MOCK_PHENOMENA;
    return requestJson<PhenomenonDto[]>('/phenomena');
  },

  async getPhenomenonMap(code: string, from: number, to: number): Promise<PhenomenonMapResponseDto> {
    if (useMocksMode) return buildMockPhenomenonMap(code, from, to);
    return requestJson<PhenomenonMapResponseDto>(`/phenomena/${code}/map`, { from, to });
  },

  async getPhenomenonObjectDetail(
    code: string,
    object: string,
    from: number,
    to: number
  ): Promise<PhenomenonObjectDetailDto> {
    if (useMocksMode) return buildMockPhenomenonObjectDetail(code, object, from, to);
    return requestJson<PhenomenonObjectDetailDto>(`/phenomena/${code}/objects/${object}`, { from, to });
  },

  async getCompareAuto(params: {
    variable: string;
    type?: string;
    from: number;
    to: number;
  }): Promise<ComparePairResponseDto> {
    if (useMocksMode) {
      return buildMockCompare(params.variable, 'chuy_reg', 'batken_reg', params.from, params.to, true);
    }
    return requestJson<ComparePairResponseDto>('/compare/auto', params);
  },

  async getCompareManual(params: {
    variable: string;
    a: string;
    b: string;
    from: number;
    to: number;
  }): Promise<ComparePairResponseDto> {
    if (useMocksMode) {
      return buildMockCompare(params.variable, params.a, params.b, params.from, params.to, false);
    }
    return requestJson<ComparePairResponseDto>('/compare', params);
  },

  async getTrendsTable(params: {
    variable: string;
    type?: string;
    from: number;
    to: number;
  }): Promise<ObjectTrendTableRowDto[]> {
    if (useMocksMode) return buildMockTrendsTable(params.variable);
    return requestJson<ObjectTrendTableRowDto[]>('/trends', params);
  },

  getExportCsvUrl(params: {
    object?: string;
    lat?: number;
    lon?: number;
    variable: string;
    from: number;
    to: number;
  }): string {
    const url = new URL(`${API_BASE}/export.csv`, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
    return url.toString();
  },
};
```

---

### Шаг 3. Общие компоненты (NASA UI, Подсказки терминов, Бейдж Proxy, График Сена, Цепочка, Карта SWOT)

#### `frontend/src/components/Navbar.tsx`
```tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Globe, Compass, GitCompare, Satellite, Database } from 'lucide-react';
import { RU } from '../i18n/ru';

interface NavbarProps {
  useMocks: boolean;
  onToggleMocks: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ useMocks, onToggleMocks }) => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#0284C7] text-white shadow-sm'
        : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
    }`;

  return (
    <header className="bg-[#0B1F3A] text-white border-b border-slate-800 sticky top-0 z-[1000]">
      {useMocks && (
        <div className="bg-amber-500/95 text-slate-950 text-xs font-semibold px-4 py-1 flex items-center justify-between">
          <span>
            РЕЖИМ ЗАГЛУШЕК API (М1): отображаются демонстрационные стабы для вёрстки. Все числа помечены [ЗАГЛУШКА М1].
          </span>
          <button
            onClick={onToggleMocks}
            className="underline font-bold hover:text-slate-800 ml-4"
          >
            Переключить на живой /api/v1
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#0284C7]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-900/80 text-sky-300 border border-sky-700">
                NASA EARTHDATA • SWOT / GLDAS / MODIS
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              {RU.appTitle}
            </h1>
          </div>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" end className={linkClass}>
            <Globe className="w-4 h-4" />
            <span>{RU.nav.homeMap}</span>
          </NavLink>
          <NavLink to="/explore" className={linkClass}>
            <Compass className="w-4 h-4" />
            <span>{RU.nav.explore}</span>
          </NavLink>
          <NavLink to="/compare" className={linkClass}>
            <GitCompare className="w-4 h-4" />
            <span>{RU.nav.compare}</span>
          </NavLink>

          <button
            onClick={onToggleMocks}
            title="Переключить источник: Заглушки М1 / Реальный FastAPI бэкенд"
            className={`ml-2 px-2.5 py-1.5 rounded text-xs font-mono border flex items-center gap-1.5 ${
              useMocks
                ? 'border-amber-400/60 bg-amber-500/10 text-amber-300'
                : 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{useMocks ? 'API: M1 STUB' : 'API: LIVE'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
```

#### `frontend/src/components/TermTooltip.tsx`
Выполняет требование **Ф2.5** (*«Каждый термин имеет подсказку простыми словами»*):
```tsx
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { RU } from '../i18n/ru';

type TermKey = keyof typeof RU.terms;

export const TermTooltip: React.FC<{ term: TermKey; label?: string }> = ({ term, label }) => {
  const [open, setOpen] = useState(false);
  const info = RU.terms[term];

  return (
    <span className="relative inline-flex items-center gap-1 align-middle">
      {label && <span>{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-slate-400 hover:text-[#0284C7] focus:outline-none inline-flex items-center"
        aria-label={`Пояснение термина: ${info.title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-md bg-[#0B1F3A] text-white text-xs shadow-xl border border-slate-700 z-50 pointer-events-none">
          <div className="font-semibold text-sky-300 mb-1">{info.title}</div>
          <div className="leading-relaxed text-slate-200 font-normal">{info.text}</div>
        </div>
      )}
    </span>
  );
};
```

#### `frontend/src/components/ProxyBadge.tsx`
Выполняет требование маркировки косвенных показателей (`is_proxy`):
```tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { TermTooltip } from './TermTooltip';

export const ProxyBadge: React.FC<{ explanation?: string | null }> = ({ explanation }) => {
  return (
    <div className="inline-flex items-start gap-2 px-3 py-1.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-xs">
      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold">Косвенный спутниковый показатель (Proxy) </span>
        <TermTooltip term="proxy" />
        {explanation && <p className="mt-0.5 text-amber-800">{explanation}</p>}
      </div>
    </div>
  );
};
```

#### `frontend/src/components/TrendBadge.tsx`
Передаёт направление тренда и цветом, и значком со словом, а значимость — словами (раздел 11 ТЗ):
```tsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { TrendDirection } from '../types/api';
import { RU } from '../i18n/ru';

interface TrendBadgeProps {
  trend: TrendDirection;
  pValue?: number | null;
  showSignificance?: boolean;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({ trend, pValue, showSignificance = true }) => {
  const getStyle = () => {
    switch (trend) {
      case 'increasing':
        return {
          bg: 'bg-sky-50 border-sky-300 text-sky-900',
          icon: <TrendingUp className="w-4 h-4 text-sky-700" />,
          label: RU.trendLabels.increasing,
        };
      case 'decreasing':
        return {
          bg: 'bg-orange-50 border-orange-300 text-orange-900',
          icon: <TrendingDown className="w-4 h-4 text-orange-700" />,
          label: RU.trendLabels.decreasing,
        };
      case 'weak_increasing':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          icon: <TrendingUp className="w-4 h-4 text-amber-700" />,
          label: RU.trendLabels.weak_increasing,
        };
      case 'weak_decreasing':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          icon: <TrendingDown className="w-4 h-4 text-amber-700" />,
          label: RU.trendLabels.weak_decreasing,
        };
      case 'insufficient_data':
        return {
          bg: 'bg-slate-100 border-slate-300 text-slate-700',
          icon: <AlertTriangle className="w-4 h-4 text-slate-500" />,
          label: RU.trendLabels.insufficient_data,
        };
      default:
        return {
          bg: 'bg-slate-100 border-slate-300 text-slate-800',
          icon: <Minus className="w-4 h-4 text-slate-600" />,
          label: RU.trendLabels.no_trend,
        };
    }
  };

  const getSigText = () => {
    if (pValue === null || pValue === undefined || trend === 'insufficient_data') return null;
    if (pValue < 0.05) return RU.significanceLabels.confident;
    if (pValue < 0.1) return RU.significanceLabels.weak;
    return RU.significanceLabels.none;
  };

  const style = getStyle();
  const sigText = getSigText();

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold ${style.bg}`}>
        {style.icon}
        <span>{style.label}</span>
      </span>
      {showSignificance && sigText && (
        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
          Значимость: {sigText}
        </span>
      )}
    </div>
  );
};
```

#### `frontend/src/components/TrendChart.tsx`
Выполняет все требования **Ф3.5** и **раздела 11**:
- Годовые значения (основная чёткая линия с точками).
- Месячный ряд тонкой линией на заднем плане (переключаемый).
- Линия тренда по наклону Сена (`sen_slope`, `intercept`).
- Отметки пропусков, интерполированных (`filled`) и отброшенных (`outlier`) точек.
- Источник данных и период под графиком.

```tsx
import React, { useState } from 'react';
import { SeriesResponseDto, TrendResponseDto } from '../types/api';

interface TrendChartProps {
  series: SeriesResponseDto;
  trend: TrendResponseDto;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ series, trend, height = 320 }) => {
  const [showMonthly, setShowMonthly] = useState(true);

  const validYearly = series.yearly.filter((d) => d.value !== null) as { year: number; value: number }[];
  const validMonthly = series.monthly.filter((d) => d.value !== null) as {
    date: string;
    value: number;
    quality: 'ok' | 'filled' | 'outlier';
  }[];

  if (validYearly.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-sm text-slate-500">
        Нет валидных годовых значений для построения графика
      </div>
    );
  }

  const minYear = series.yearly[0]?.year ?? trend.from_year;
  const maxYear = series.yearly[series.yearly.length - 1]?.year ?? trend.to_year;

  const allValues = [
    ...validYearly.map((d) => d.value),
    ...(showMonthly ? validMonthly.filter((m) => m.quality !== 'outlier').map((d) => d.value) : []),
  ];

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const pad = (maxVal - minVal || 1) * 0.12;
  const yMin = minVal - pad;
  const yMax = maxVal + pad;

  const width = 760;
  const padLeft = 58;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xForYear = (yearFloat: number) => {
    const span = Math.max(1, maxYear - minYear);
    return padLeft + ((yearFloat - minYear) / span) * plotW;
  };

  const yForVal = (val: number) => {
    return padTop + plotH - ((val - yMin) / (yMax - yMin || 1)) * plotH;
  };

  // Точки годового ряда
  const yearlyPath = validYearly
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xForYear(pt.year).toFixed(1)} ${yForVal(pt.value).toFixed(1)}`)
    .join(' ');

  // Точки месячного ряда (тонкая линия)
  const monthlyOk = validMonthly.filter((m) => m.quality !== 'outlier');
  const monthlyPath = monthlyOk
    .map((pt, i) => {
      const [yStr, mStr] = pt.date.split('-');
      const yf = Number(yStr) + (Number(mStr) - 1) / 12;
      return `${i === 0 ? 'M' : 'L'} ${xForYear(yf).toFixed(1)} ${yForVal(pt.value).toFixed(1)}`;
    })
    .join(' ');

  // Линия тренда по Сену (Ф3.5)
  const hasSenLine =
    trend.status === 'ok' &&
    trend.sen_slope !== null &&
    trend.intercept !== null &&
    trend.trend !== 'insufficient_data';

  const senY1 = hasSenLine ? trend.intercept! + trend.sen_slope! * (minYear - trend.base_year) : 0;
  const senY2 = hasSenLine ? trend.intercept! + trend.sen_slope! * (maxYear - trend.base_year) : 0;

  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
  const xStep = Math.max(1, Math.round((maxYear - minYear) / 6));
  const xTicks: number[] = [];
  for (let y = minYear; y <= maxYear; y += xStep) xTicks.push(y);

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
            <span className="w-3 h-0.5 bg-[#0B1F3A] inline-block" />
            Годовой ряд ({series.yearly_agg === 'mean' ? 'среднее' : series.yearly_agg === 'sum' ? 'сумма' : 'макс.'})
          </span>
          {hasSenLine && (
            <span className="inline-flex items-center gap-1.5 font-medium text-[#0284C7]">
              <span className="w-4 border-t-2 border-dashed border-[#0284C7] inline-block" />
              Линия тренда Сена ({trend.sen_slope! > 0 ? '+' : ''}
              {trend.sen_slope} {series.unit}/год)
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Интерполировано (filled)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-rose-600 bg-rose-100 inline-block" />
            Выброс (outlier)
          </span>
        </div>

        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showMonthly}
            onChange={(e) => setShowMonthly(e.target.checked)}
            className="rounded border-slate-300 text-[#0284C7] focus:ring-[#0284C7]"
          />
          <span>Показывать месячный ряд тонкой линией</span>
        </label>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Сетка по Y */}
        {yTicks.map((tv, idx) => {
          const y = yForVal(tv);
          return (
            <g key={idx}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
                {tv.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Метки по X */}
        {xTicks.map((yr) => {
          const x = xForYear(yr);
          return (
            <g key={yr}>
              <line x1={x} y1={padTop} x2={x} y2={padTop + plotH} stroke="#F1F5F9" />
              <text x={x} y={height - 10} textAnchor="middle" className="fill-slate-600 text-[11px] font-mono">
                {yr}
              </text>
            </g>
          );
        })}

        {/* Месячный ряд тонкой линией (Ф3.5) */}
        {showMonthly && monthlyPath && (
          <path d={monthlyPath} fill="none" stroke="#94A3B8" strokeWidth="1" opacity="0.65" />
        )}

        {/* Точки filled и outlier на месячном ряде */}
        {showMonthly &&
          validMonthly
            .filter((m) => m.quality !== 'ok')
            .map((m) => {
              const [yStr, mStr] = m.date.split('-');
              const yf = Number(yStr) + (Number(mStr) - 1) / 12;
              return (
                <circle
                  key={m.date}
                  cx={xForYear(yf)}
                  cy={yForVal(m.value)}
                  r={3.5}
                  className={
                    m.quality === 'filled'
                      ? 'fill-amber-500 stroke-white'
                      : 'fill-rose-100 stroke-rose-600 stroke-2'
                  }
                >
                  <title>{`${m.date}: ${m.value} ${series.unit} (${m.quality})`}</title>
                </circle>
              );
            })}

        {/* Годовой ряд */}
        <path d={yearlyPath} fill="none" stroke="#0B1F3A" strokeWidth="2.2" />

        {/* Отметка пропущенных лет */}
        {series.yearly
          .filter((y) => y.value === null)
          .map((missingYr) => (
            <g key={missingYr.year}>
              <line
                x1={xForYear(missingYr.year)}
                y1={padTop}
                x2={xForYear(missingYr.year)}
                y2={padTop + plotH}
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            </g>
          ))}

        {/* Годовые точки */}
        {validYearly.map((pt) => (
          <circle
            key={pt.year}
            cx={xForYear(pt.year)}
            cy={yForVal(pt.value)}
            r={3.8}
            className="fill-[#0B1F3A] stroke-white stroke-[1.5] hover:r-5 transition-all"
          >
            <title>{`${pt.year} г.: ${pt.value} ${series.unit}`}</title>
          </circle>
        ))}

        {/* Линия Сена */}
        {hasSenLine && (
          <line
            x1={xForYear(minYear)}
            y1={yForVal(senY1)}
            x2={xForYear(maxYear)}
            y2={yForVal(senY2)}
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />
        )}
      </svg>

      {/* Подпись источника и периода под графиком (раздел 11) */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div>
          <span className="font-semibold text-slate-700">Источник:</span> {series.source.name} (
          <code className="text-slate-600">{series.source.dataset_id}</code>) • Лицензия: {series.source.license}
        </div>
        <div>
          Период: <span className="font-mono text-slate-700">{trend.from_year}–{trend.to_year} гг.</span> • Единица:{' '}
          <span className="font-mono text-slate-700">{series.unit}</span>
        </div>
      </div>
    </div>
  );
};
```

#### `frontend/src/components/ChainFlow.tsx`
Выполняет требование **Ф4.1–Ф4.6** (карточки цепочки со стрелками, ранговой корреляцией Спирмена между соседними звеньями, статусами, мини-графиками и кликом для перехода к полному анализу):
```tsx
import React from 'react';
import { ArrowRight, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { ChainLinkDto, ChainResponseDto } from '../types/api';
import { RU } from '../i18n/ru';
import { TermTooltip } from './TermTooltip';

interface ChainFlowProps {
  chain: ChainResponseDto;
  activeVariable: string;
  onSelectVariable: (variableCode: string) => void;
}

export const ChainFlow: React.FC<ChainFlowProps> = ({ chain, activeVariable, onSelectVariable }) => {
  const renderSparkline = (link: ChainLinkDto) => {
    const pts = link.yearly_sparkline.filter((p) => p.value !== null) as { year: number; value: number }[];
    if (pts.length < 2) return null;
    const vals = pts.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const w = 120;
    const h = 32;
    const path = pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - ((p.value - min) / (max - min || 1)) * (h - 6) - 3;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8 mt-2 bg-slate-50 rounded border border-slate-100">
        <path d={path} fill="none" stroke="#0284C7" strokeWidth="1.8" />
      </svg>
    );
  };

  const statusBadge = (status: ChainLinkDto['status']) => {
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3" /> {RU.chainStatuses.confirmed}
        </span>
      );
    }
    if (status === 'unconfirmed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
          <XCircle className="w-3 h-3" /> {RU.chainStatuses.unconfirmed}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
        <HelpCircle className="w-3 h-3" /> {RU.chainStatuses.no_data}
      </span>
    );
  };

  return (
    <section className="bg-white border border-slate-200 rounded-md p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Цепочка связанных процессов системы Земли: {chain.chain_name}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">{chain.summary_caution_text}</p>
        </div>
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <span>Связь соседних звеньев:</span>
          <TermTooltip term="spearman" label="корреляция Спирмена (rₛ)" />
        </div>
      </div>

      {/* Горизонтальный ряд карточек со стрелками (Ф4.5) */}
      <div className="mt-4 flex flex-col lg:flex-row items-stretch gap-2 overflow-x-auto pb-2">
        {chain.links.map((link, idx) => {
          const isCurrent = link.variable_code === activeVariable;
          return (
            <React.Fragment key={link.variable_code}>
              {idx > 0 && (
                <div className="flex flex-row lg:flex-col items-center justify-center px-1 py-1 text-slate-400 shrink-0">
                  <ArrowRight className="w-5 h-5 text-slate-500 rotate-90 lg:rotate-0" />
                  {link.spearman_r_prev !== null && (
                    <span
                      className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 mt-1"
                      title={`Ранговая корреляция Спирмена с предыдущим звеном (p = ${link.spearman_p_prev ?? '—'})`}
                    >
                      rₛ = {link.spearman_r_prev > 0 ? '+' : ''}
                      {link.spearman_r_prev.toFixed(2)}
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => onSelectVariable(link.variable_code)}
                className={`flex-1 min-w-[195px] text-left p-3.5 rounded-md border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-[#0284C7] bg-sky-50/40 ring-1 ring-[#0284C7]'
                    : 'border-slate-200 hover:border-slate-400 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[11px] font-mono text-slate-500">Звено {link.order}</span>
                    {statusBadge(link.status)}
                  </div>
                  <div className="font-semibold text-sm text-slate-900 leading-snug">
                    {link.variable_name}
                    {link.is_proxy && (
                      <span className="ml-1 text-[10px] font-mono px-1 py-0.5 rounded bg-amber-100 text-amber-800">
                        proxy
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-xs font-mono text-slate-800">
                    {link.sen_slope !== null ? (
                      <>
                        {link.sen_slope > 0 ? '↑ +' : '↓ '}
                        {link.sen_slope} {link.unit}/год
                      </>
                    ) : (
                      'Нет оценки'
                    )}
                  </div>
                  {renderSparkline(link)}
                </div>

                <p className="mt-2 text-[11px] text-slate-600 leading-normal">{link.explanation_text}</p>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
        {RU.cautionChainBanner} Нажмите на любую карточку звена, чтобы открыть полный анализ этой переменной.
      </div>
    </section>
  );
};
```

#### `frontend/src/components/KyrgyzstanMap.tsx`
Интерактивная карта Кыргызстана (Leaflet) с белыми выносками-флажками в стиле постера **SWOT Mission** (для Главного экрана Ф5 и выбора произвольной точки Ф2.2):
```tsx
import React from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GeoObjectDto, PhenomenonMapObjectDto } from '../types/api';

interface MapClickHandlerProps {
  onPickPoint?: (lat: number, lon: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onPickPoint }) => {
  useMapEvents({
    click(e) {
      if (onPickPoint) {
        onPickPoint(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
      }
    },
  });
  return null;
};

interface KyrgyzstanMapProps {
  mode: 'phenomena' | 'picker';
  phenomenaObjects?: PhenomenonMapObjectDto[];
  catalogObjects?: GeoObjectDto[];
  selectedObjectCode?: string;
  pickedPoint?: { lat: number; lon: number } | null;
  onSelectObject?: (code: string) => void;
  onPickPoint?: (lat: number, lon: number) => void;
}

export const KyrgyzstanMap: React.FC<KyrgyzstanMapProps> = ({
  mode,
  phenomenaObjects = [],
  catalogObjects = [],
  selectedObjectCode,
  pickedPoint,
  onSelectObject,
  onPickPoint,
}) => {
  const centerKg: [number, number] = [41.45, 74.85];

  const makeSwotDivIcon = (obj: PhenomenonMapObjectDto, isSelected: boolean) => {
    const arrow = obj.trend === 'increasing' ? '↑' : obj.trend === 'decreasing' ? '↓' : '→';
    const slopeText =
      obj.sen_slope !== null ? `${obj.sen_slope > 0 ? '+' : ''}${obj.sen_slope} ${obj.unit}/г` : 'нет тренда';
    const opacityClass = obj.is_significant ? 'opacity-100' : 'opacity-65';
    const activeBorder = isSelected ? 'border-[#0284C7] ring-2 ring-[#0284C7]' : '';

    return L.divIcon({
      className: 'custom-swot-marker',
      html: `
        <div class="swot-callout-pin ${opacityClass} ${activeBorder}">
          <div style="font-weight:700; color:#0B1F3A;">${obj.object_name}</div>
          <div style="font-family:monospace; color:${
            obj.trend === 'decreasing' ? '#C2410C' : obj.trend === 'increasing' ? '#0369A1' : '#64748B'
          };">
            ${arrow} ${slopeText}
          </div>
        </div>
      `,
      iconSize: [140, 44],
      iconAnchor: [70, 50],
    });
  };

  return (
    <div className="relative w-full h-[430px] rounded-md overflow-hidden border border-slate-300 shadow-sm">
      <MapContainer center={centerKg} zoom={7} className="w-full h-full z-0" scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mode === 'picker' && <MapClickHandler onPickPoint={onPickPoint} />}

        {/* Режим Ф5: Глобальные явления с выносками в стиле SWOT и размером точки по силе тренда */}
        {mode === 'phenomena' &&
          phenomenaObjects.map((obj) => {
            const isSelected = obj.object_code === selectedObjectCode;
            const radius = 8 + Math.abs(obj.normalized_slope) * 12;
            const fillColor = !obj.is_significant
              ? '#94A3B8'
              : obj.trend === 'decreasing'
              ? '#EA580C'
              : '#0284C7';

            return (
              <React.Fragment key={obj.object_code}>
                <CircleMarker
                  center={obj.marker}
                  radius={radius}
                  pathOptions={{
                    color: isSelected ? '#0B1F3A' : '#FFFFFF',
                    weight: isSelected ? 3 : 1.5,
                    fillColor,
                    fillOpacity: obj.is_significant ? 0.85 : 0.4,
                  }}
                  eventHandlers={{
                    click: () => onSelectObject && onSelectObject(obj.object_code),
                  }}
                />
                <Marker
                  position={obj.marker}
                  icon={makeSwotDivIcon(obj, isSelected)}
                  eventHandlers={{
                    click: () => onSelectObject && onSelectObject(obj.object_code),
                  }}
                />
              </React.Fragment>
            );
          })}

        {/* Режим Ф2.2: Выбор объекта или произвольной точки */}
        {mode === 'picker' &&
          catalogObjects.map((obj) => {
            const isSelected = obj.code === selectedObjectCode;
            return (
              <CircleMarker
                key={obj.code}
                center={obj.marker}
                radius={isSelected ? 10 : 7}
                pathOptions={{
                  color: '#0B1F3A',
                  weight: isSelected ? 3 : 1.5,
                  fillColor: isSelected ? '#0284C7' : '#38BDF8',
                  fillOpacity: 0.9,
                }}
                eventHandlers={{
                  click: () => onSelectObject && onSelectObject(obj.code),
                }}
              />
            );
          })}

        {mode === 'picker' && pickedPoint && (
          <CircleMarker
            center={[pickedPoint.lat, pickedPoint.lon]}
            radius={9}
            pathOptions={{
              color: '#0B1F3A',
              weight: 2.5,
              fillColor: '#F59E0B',
              fillOpacity: 0.95,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
```

---

### Шаг 4. Экраны приложения (`HomePhenomenaPage`, `ExploreResultPage`, `ComparePage`)

#### 1. Главный экран: Карта явлений (`frontend/src/pages/HomePhenomenaPage.tsx`) — Ф5
```tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { apiClient } from '../api/client';
import {
  PhenomenonDto,
  PhenomenonMapResponseDto,
  PhenomenonObjectDetailDto,
} from '../types/api';
import { KyrgyzstanMap } from '../components/KyrgyzstanMap';
import { TrendBadge } from '../components/TrendBadge';

export const HomePhenomenaPage: React.FC = () => {
  const navigate = useNavigate();
  const [phenomena, setPhenomena] = useState<PhenomenonDto[]>([]);
  const [selectedPhenomenon, setSelectedPhenomenon] = useState<string>('global_warming');
  const [fromYear, setFromYear] = useState<number>(2000);
  const [toYear, setToYear] = useState<number>(2025);

  const [mapData, setMapData] = useState<PhenomenonMapResponseDto | null>(null);
  const [selectedObjectCode, setSelectedObjectCode] = useState<string>('issyk_kul');
  const [detail, setDetail] = useState<PhenomenonObjectDetailDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getPhenomena()
      .then((list) => {
        setPhenomena(list);
        if (list.length > 0) setSelectedPhenomenon(list[0].code);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedPhenomenon) return;
    setLoading(true);
    setError(null);
    apiClient
      .getPhenomenonMap(selectedPhenomenon, fromYear, toYear)
      .then((res) => {
        setMapData(res);
        const firstCode = res.objects[0]?.object_code || 'issyk_kul';
        setSelectedObjectCode((prev) =>
          res.objects.some((o) => o.object_code === prev) ? prev : firstCode
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedPhenomenon, fromYear, toYear]);

  useEffect(() => {
    if (!selectedPhenomenon || !selectedObjectCode) return;
    apiClient
      .getPhenomenonObjectDetail(selectedPhenomenon, selectedObjectCode, fromYear, toYear)
      .then(setDetail)
      .catch((e) => setError(e.message));
  }, [selectedPhenomenon, selectedObjectCode, fromYear, toYear]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Панель выбора глобального явления и периода (Ф5.2, Ф5.5) */}
      <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase text-[#0284C7] font-semibold">
            Функция Ф5 • От глобальных процессов к объектам Кыргызстана
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {phenomena.map((p) => (
              <button
                key={p.code}
                onClick={() => setSelectedPhenomenon(p.code)}
                className={`px-3.5 py-1.5 rounded text-sm font-semibold border transition-colors ${
                  selectedPhenomenon === p.code
                    ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          {mapData && <p className="text-xs text-slate-600 pt-1 max-w-2xl">{mapData.phenomenon.description}</p>}
        </div>

        {/* Ползунки периода, действующие на карту и боковую панель одновременно (Ф5.5) */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 min-w-[280px]">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span className="inline-flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0284C7]" /> Период анализа:
            </span>
            <span className="font-mono text-sm text-[#0B1F3A]">
              {fromYear} – {toYear} гг.
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">Начало:</span>
              <input
                type="number"
                min={1995}
                max={toYear - 5}
                value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
                className="border border-slate-300 rounded px-2 py-1 font-mono"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">Конец:</span>
              <input
                type="number"
                min={fromYear + 5}
                max={2025}
                value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))}
                className="border border-slate-300 rounded px-2 py-1 font-mono"
              />
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded text-sm">
          Ошибка загрузки данных: {error}
        </div>
      )}

      {/* Карта слева + Боковая панель местного и глобального рядов справа (Ф5.1, Ф5.3, Ф5.4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-2">
          <KyrgyzstanMap
            mode="phenomena"
            phenomenaObjects={mapData?.objects || []}
            selectedObjectCode={selectedObjectCode}
            onSelectObject={setSelectedObjectCode}
          />
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 px-1">
            <span>Размер круга отражает нормированную скорость тренда (наклон Сена); незначимые тренды приглушены.</span>
            {loading && <span className="font-mono text-[#0284C7]">Обновление карты...</span>}
          </div>
        </div>

        {/* Боковая панель объекта (Ф5.4) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-5 space-y-4">
          {detail ? (
            <>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-mono uppercase text-slate-500">Выбранный объект</span>
                  <h2 className="text-lg font-bold text-slate-900">{detail.object_name}</h2>
                  <div className="text-xs text-slate-600 mt-0.5">{detail.local_trend.variable_name}</div>
                </div>
                <TrendBadge trend={detail.local_trend.trend} pValue={detail.local_trend.p_value} />
              </div>

              <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
                {detail.explanation_note}
              </p>

              {/* Сравнение двух трендов: Местный vs Глобальный (NOAA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded border border-slate-200 bg-white">
                  <div className="text-[11px] text-slate-500 font-medium">Местный показатель</div>
                  <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                    {detail.local_trend.variable_name}
                  </div>
                  <div className="text-base font-mono font-bold text-[#0B1F3A] mt-1">
                    {detail.local_trend.sen_slope !== null
                      ? `${detail.local_trend.sen_slope > 0 ? '+' : ''}${detail.local_trend.sen_slope} ${
                          detail.local_trend.unit
                        }/год`
                      : '—'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    p = {detail.local_trend.p_value ?? '—'}
                  </div>
                </div>

                <div className="p-3 rounded border border-sky-200 bg-sky-50/40">
                  <div className="text-[11px] text-sky-800 font-medium">Глобальный фон (NOAA)</div>
                  <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                    {detail.global_trend.variable_name}
                  </div>
                  <div className="text-base font-mono font-bold text-[#0284C7] mt-1">
                    {detail.global_trend.sen_slope !== null
                      ? `+${detail.global_trend.sen_slope} ${detail.global_trend.unit}/год`
                      : '—'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    p = {detail.global_trend.p_value ?? '—'}
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate(
                    `/explore?section=water&object=${detail.object_code}&variable=${detail.local_trend.variable_code}&from=${fromYear}&to=${toYear}`
                  )
                }
                className="w-full py-2.5 px-4 rounded bg-[#0B1F3A] hover:bg-[#0284C7] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span>Открыть полный статистический анализ и цепочку причин</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="text-sm text-slate-500 py-8 text-center">
              Выберите подсвеченный объект на карте Кыргызстана
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

#### 2. Экран «Исследовать» и «Результат анализа» (`frontend/src/pages/ExploreResultPage.tsx`) — Ф2, Ф3, Ф4
Выполняет требование *«До результата — не более четырёх кликов»*, синхронизацию всех параметров с URL-адресом (`?section=...&object=...&variable=...&from=...&to=...`), вывод простыми словами сверху, график с линией Сена, блок «Подробнее», скачивание CSV и цепочку Ф4:
```tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download, GitCompare, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { apiClient } from '../api/client';
import {
  ChainResponseDto,
  GeoObjectDto,
  SectionDto,
  SeriesResponseDto,
  TrendResponseDto,
  VariableDto,
} from '../types/api';
import { RU } from '../i18n/ru';
import { TrendBadge } from '../components/TrendBadge';
import { ProxyBadge } from '../components/ProxyBadge';
import { TrendChart } from '../components/TrendChart';
import { ChainFlow } from '../components/ChainFlow';
import { TermTooltip } from '../components/TermTooltip';
import { KyrgyzstanMap } from '../components/KyrgyzstanMap';

export const ExploreResultPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Состояние шагов хранится в URL (Ф2.4)
  const sectionParam = searchParams.get('section') || 'water';
  const objectParam = searchParams.get('object') || 'issyk_kul';
  const variableParam = searchParams.get('variable') || 'water_level';
  const fromParam = Number(searchParams.get('from') || 2000);
  const toParam = Number(searchParams.get('to') || 2025);
  const latParam = searchParams.get('lat') ? Number(searchParams.get('lat')) : null;
  const lonParam = searchParams.get('lon') ? Number(searchParams.get('lon')) : null;

  const [placeMode, setPlaceMode] = useState<'object' | 'region' | 'point'>(
    latParam !== null ? 'point' : 'object'
  );
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [showDetailsBlock, setShowDetailsBlock] = useState<boolean>(true);

  const [sections, setSections] = useState<SectionDto[]>([]);
  const [objects, setObjects] = useState<GeoObjectDto[]>([]);
  const [variables, setVariables] = useState<VariableDto[]>([]);

  const [series, setSeries] = useState<SeriesResponseDto | null>(null);
  const [trend, setTrend] = useState<TrendResponseDto | null>(null);
  const [chain, setChain] = useState<ChainResponseDto | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const updateQuery = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  useEffect(() => {
    Promise.all([apiClient.getSections(), apiClient.getObjects()])
      .then(([secList, objList]) => {
        setSections(secList);
        setObjects(objList);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    apiClient
      .getVariables(sectionParam, objectParam)
      .then((vars) => {
        setVariables(vars);
        if (vars.length > 0 && !vars.some((v) => v.code === variableParam
        
        
        
        





В прошлом сообщении код оборвался на середине файла `ExploreResultPage.tsx`. Давай я дам тебе **пошаговую инструкцию на 3 минуты**, как поднять проект у себя на ноуте и сразу открыть его в браузере на `http://localhost:5173`, а ниже — **оставшиеся 4 файла**, чтобы всё завелось без единой ошибки.

---

## 1. Общая архитектура репозитория (как вы стыкуетесь втроём)

В корне вашего общего Git-репозитория должно быть 3 независимые папки. Твоя папка — **только `frontend/`**:

```text
nasa-space-apps-kg/              <-- Корень репозитория команды
├── docker-compose.yml           <-- (Делает Бэкендер) Поднимает db, backend, frontend
├── etl/                         <-- (Делает Дата-инженер) Скрипты скачивания NASA/Hydroweb
├── backend/                     <-- (Делает Бэкендер) FastAPI + pymannkendall (порт 8000)
└── frontend/                    <-- (ТВОЯ ЗОНА) React + TS + Vite + Leaflet (порт 5173)
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx             # Точка входа React
        ├── App.tsx              # Роутинг между 3 главными экранами
        ├── index.css            # Стили NASA + флажки на карте
        ├── types/
        │   └── api.ts           # Типы данных (из прошлого сообщения)
        ├── i18n/
        │   └── ru.ts            # Русский словарь и подсказки терминов (из прошлого сообщения)
        ├── api/
        │   ├── mockStubs.ts     # Заглушки М1 (чтобы ты видел графики без бэкенда!)
        │   └── client.ts        # Переключатель Заглушки <-> Реальный API /api/v1
        ├── components/          # Общие блоки (из прошлого сообщения)
        │   ├── Navbar.tsx
        │   ├── TermTooltip.tsx
        │   ├── ProxyBadge.tsx
        │   ├── TrendBadge.tsx
        │   ├── TrendChart.tsx
        │   ├── ChainFlow.tsx
        │   └── KyrgyzstanMap.tsx
        └── pages/               # Экраны приложения (код ниже!)
            ├── HomePhenomenaPage.tsx
            ├── ExploreResultPage.tsx
            └── ComparePage.tsx
```

**Как это работает сейчас:**
Пока твой бэкендер ещё пишет свой FastAPI, у тебя в `client.ts` по умолчанию включён режим **`API: M1 STUB`**. Поэтому как только ты запустишь `npm run dev`, у тебя **сразу откроется рабочий сайт с картой Кыргызстана, графиками Иссык-Куля, линией тренда Сена, цепочкой и сравнением областей**. А когда бэкендер поднимет сервер — ты просто нажмёшь кнопку `API: M1 STUB` в правом верхнем углу шапки, и фронт переключится на живой `http://localhost:8000/api/v1`.

---

## 2. Как развернуть и увидеть результат (по шагам в терминале)

Открой терминал (VS Code / WebStorm / консоль) в папке вашего проекта и выполни:

### Шаг 1. Создай проект Vite и установи пакеты
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install leaflet react-leaflet react-router-dom lucide-react
npm install -D tailwindcss@3 postcss autoprefixer @types/leaflet
npx tailwindcss init -p
```

### Шаг 2. Замени `tailwind.config.js` в корне `frontend/`
Открой созданный файл `frontend/tailwind.config.js` и вставь:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Шаг 3. Разложи файлы внутри `frontend/src/`
Создай внутри `frontend/src/` папки `types`, `i18n`, `api`, `components`, `pages`.
Скопируй туда файлы из прошлого сообщения, а для **недостающих файлов** (`ExploreResultPage.tsx`, `ComparePage.tsx`, `App.tsx`, `main.tsx`) вставь код ниже.

---

## 3. Недостающие файлы (на которых оборвалось прошлое сообщение)

### 1) `frontend/src/pages/ExploreResultPage.tsx` (Полная версия)
Экран **«Исследовать» + «Результат анализа» + «Цепочка»** (Ф2, Ф3, Ф4):

```tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download, GitCompare, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { apiClient } from '../api/client';
import {
  ChainResponseDto,
  GeoObjectDto,
  SectionDto,
  SeriesResponseDto,
  TrendResponseDto,
  VariableDto,
} from '../types/api';
import { RU } from '../i18n/ru';
import { TrendBadge } from '../components/TrendBadge';
import { ProxyBadge } from '../components/ProxyBadge';
import { TrendChart } from '../components/TrendChart';
import { ChainFlow } from '../components/ChainFlow';
import { TermTooltip } from '../components/TermTooltip';
import { KyrgyzstanMap } from '../components/KyrgyzstanMap';

export const ExploreResultPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Все параметры выбора синхронизируются с URL (Ф2.4)
  const sectionParam = searchParams.get('section') || 'water';
  const objectParam = searchParams.get('object') || 'issyk_kul';
  const variableParam = searchParams.get('variable') || 'water_level';
  const fromParam = Number(searchParams.get('from') || 2000);
  const toParam = Number(searchParams.get('to') || 2025);
  const latParam = searchParams.get('lat') ? Number(searchParams.get('lat')) : null;
  const lonParam = searchParams.get('lon') ? Number(searchParams.get('lon')) : null;

  const [placeMode, setPlaceMode] = useState<'object' | 'region' | 'point'>(
    latParam !== null ? 'point' : 'object'
  );
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [showDetailsBlock, setShowDetailsBlock] = useState<boolean>(true);

  const [sections, setSections] = useState<SectionDto[]>([]);
  const [objects, setObjects] = useState<GeoObjectDto[]>([]);
  const [variables, setVariables] = useState<VariableDto[]>([]);

  const [series, setSeries] = useState<SeriesResponseDto | null>(null);
  const [trend, setTrend] = useState<TrendResponseDto | null>(null);
  const [chain, setChain] = useState<ChainResponseDto | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const updateQuery = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  useEffect(() => {
    Promise.all([apiClient.getSections(), apiClient.getObjects()])
      .then(([secList, objList]) => {
        setSections(secList);
        setObjects(objList);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    apiClient
      .getVariables(sectionParam, objectParam)
      .then((vars) => {
        setVariables(vars);
        if (vars.length > 0 && !vars.some((v) => v.code === variableParam)) {
          updateQuery({ variable: vars[0].code });
        }
      })
      .catch((e) => setError(e.message));
  }, [sectionParam, objectParam]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const queryArgs =
      placeMode === 'point' && latParam !== null && lonParam !== null
        ? { lat: latParam, lon: lonParam, variable: variableParam, from: fromParam, to: toParam }
        : { object: objectParam, variable: variableParam, from: fromParam, to: toParam };

    Promise.all([
      apiClient.getSeries(queryArgs),
      apiClient.getTrend(queryArgs),
      apiClient.getChain({
        object: objectParam,
        variable: variableParam,
        from: fromParam,
        to: toParam,
      }),
    ])
      .then(([sRes, tRes, cRes]) => {
        setSeries(sRes);
        setTrend(tRes);
        setChain(cRes);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [objectParam, variableParam, fromParam, toParam, latParam, lonParam, placeMode]);

  const filteredObjects = objects.filter((o) =>
    placeMode === 'region' ? o.type === 'region' : o.type !== 'region'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Пошаговый выбор: Раздел -> Место -> Параметр -> Период (Ф2.1–Ф2.3) */}
      <section className="bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Шаг 1: Раздел */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {RU.steps.section}
            </label>
            <select
              value={sectionParam}
              onChange={(e) => updateQuery({ section: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-medium bg-white focus:border-[#0284C7] focus:outline-none"
            >
              {sections.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Шаг 2: Место (Объект / Регион / Точка на карте) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">{RU.steps.place}</label>
              <div className="flex gap-1 text-[11px]">
                {(['object', 'region', 'point'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPlaceMode(m);
                      if (m === 'point') setShowMapPicker(true);
                    }}
                    className={`px-1.5 py-0.5 rounded ${
                      placeMode === m
                        ? 'bg-[#0B1F3A] text-white font-semibold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {m === 'object' ? 'Объект' : m === 'region' ? 'Область' : 'Точка'}
                  </button>
                ))}
              </div>
            </div>

            {placeMode !== 'point' ? (
              <select
                value={objectParam}
                onChange={(e) => updateQuery({ object: e.target.value, lat: null, lon: null })}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-medium bg-white"
              >
                {filteredObjects.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => setShowMapPicker((v) => !v)}
                className="w-full border border-[#0284C7] bg-sky-50/50 text-[#0B1F3A] rounded px-3 py-2 text-xs font-mono flex items-center justify-between"
              >
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0284C7]" />
                  {latParam && lonParam ? `${latParam}°N, ${lonParam}°E` : 'Выбрать точку на карте КР'}
                </span>
                <span className="underline">Карта</span>
              </button>
            )}
          </div>

          {/* Шаг 3: Переменная */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {RU.steps.variable}
            </label>
            <select
              value={variableParam}
              onChange={(e) => updateQuery({ variable: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-medium bg-white"
            >
              {variables.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.name} ({v.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Шаг 4: Период */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {RU.steps.period}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1990}
                max={toParam - 1}
                value={fromParam}
                onChange={(e) => updateQuery({ from: Number(e.target.value) })}
                className="border border-slate-300 rounded px-2.5 py-2 text-sm font-mono"
              />
              <input
                type="number"
                min={fromParam + 1}
                max={2025}
                value={toParam}
                onChange={(e) => updateQuery({ to: Number(e.target.value) })}
                className="border border-slate-300 rounded px-2.5 py-2 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Выпадающая карта для выбора произвольной точки или объекта (Ф2.2) */}
        {showMapPicker && (
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Кликните в любую точку Кыргызстана для анализа по ближайшей ячейке сетки WGS84:</span>
              <button
                type="button"
                onClick={() => setShowMapPicker(false)}
                className="text-slate-800 font-semibold underline"
              >
                Скрыть карту
              </button>
            </div>
            <KyrgyzstanMap
              mode="picker"
              catalogObjects={objects}
              selectedObjectCode={objectParam}
              pickedPoint={latParam && lonParam ? { lat: latParam, lon: lonParam } : null}
              onSelectObject={(code) => {
                setPlaceMode('object');
                updateQuery({ object: code, lat: null, lon: null });
              }}
              onPickPoint={(lat, lon) => {
                setPlaceMode('point');
                updateQuery({ lat, lon });
              }}
            />
          </div>
        )}
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded text-sm">
          Ошибка запроса: {error}
        </div>
      )}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-md p-8 text-center text-sm text-slate-500 font-mono">
          Загрузка нормализованного ряда и расчёт теста Манна–Кендалла...
        </div>
      )}

      {/* РЕЗУЛЬТАТ АНАЛИЗА (Ф3) */}
      {!loading && series && trend && (
        <div className="space-y-5">
          {/* Карточка главного вывода простыми словами сверху (Ф3.6, раздел 11) */}
          <section className="bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-slate-500 uppercase">
                  Результат статистического анализа тренда ({trend.from_year}–{trend.to_year} гг.)
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {series.object_name} — {series.variable_name}
                </h2>
              </div>
              <TrendBadge trend={trend.trend} pValue={trend.p_value} />
            </div>

            {series.is_proxy && <ProxyBadge explanation={series.proxy_note} />}

            {/* Главный вывод простыми словами (Ф3.6) */}
            <div
              className={`p-4 rounded-md border text-sm leading-relaxed font-medium ${
                trend.status === 'insufficient_data'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {trend.summary_text}
            </div>

            {/* Действия: Сравнить регионы и Скачать CSV (Ф3.8, раздел 11) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/compare?variable=${series.variable_code}&from=${fromParam}&to=${toParam}`)
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#0B1F3A] hover:bg-[#0284C7] text-white text-xs font-semibold transition-colors"
                >
                  <GitCompare className="w-4 h-4" />
                  <span>Сравнить с другими объектами КР</span>
                </button>

                <a
                  href={apiClient.getExportCsvUrl({
                    object: objectParam,
                    variable: variableParam,
                    from: fromParam,
                    to: toParam,
                  })}
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Скачать очищенный ряд и тест (CSV)</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailsBlock((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:underline"
              >
                <span>{showDetailsBlock ? 'Скрыть параметры теста' : 'Подробнее (параметры теста)'}</span>
                {showDetailsBlock ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Блок «Подробнее» с числами теста и подсказками к терминам (Ф3.7, Ф2.5) */}
            {showDetailsBlock && (
              <div className="mt-3 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">
                    <TermTooltip term="sen_slope" label="Наклон Сена" />
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                    {trend.sen_slope !== null
                      ? `${trend.sen_slope > 0 ? '+' : ''}${trend.sen_slope} ${trend.unit}/год`
                      : '—'}
                  </div>
                  {trend.slope_ci && (
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      95% ДИ: [{trend.slope_ci[0]}; {trend.slope_ci[1]}]
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">
                    <TermTooltip term="p_value" label="p-значение" />
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                    {trend.p_value !== null ? trend.p_value.toFixed(4) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Уровень α = 0,05</div>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">
                    <TermTooltip term="tau" label="Тау Кендалла (τ)" />
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                    {trend.tau !== null ? trend.tau.toFixed(3) : '—'}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Валидных лет (n)</div>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-1">{trend.n_years} лет</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Минимум: 10 лет</div>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Доля пропусков / интерп.</div>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                    {(trend.missing_share * 100).toFixed(1)} %
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Выбросов: {(series.outlier_share * 100).toFixed(1)} %
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">
                    <TermTooltip term="hamed_rao" label="Метод расчёта" />
                  </div>
                  <div className="font-semibold text-[11px] text-slate-900 mt-1 leading-tight">
                    {trend.method}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Научный график (Ф3.5) */}
          <TrendChart series={series} trend={trend} />

          {/* Цепочка связанных переменных (Ф4) */}
          {chain && (
            <ChainFlow
              chain={chain}
              activeVariable={variableParam}
              onSelectVariable={(vCode) => updateQuery({ variable: vCode })}
            />
          )}
        </div>
      )}
    </div>
  );
};
```

---

### 2) `frontend/src/pages/ComparePage.tsx`
Экран **«Сравнение регионов с противоположными трендами»** (Ф6.1–Ф6.5):

```tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowUpDown } from 'lucide-react';
import { apiClient } from '../api/client';
import {
  ComparePairResponseDto,
  GeoObjectDto,
  ObjectTrendTableRowDto,
  VariableDto,
} from '../types/api';
import { TrendChart } from '../components/TrendChart';
import { TrendBadge } from '../components/TrendBadge';

export const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const variableParam = searchParams.get('variable') || 'precipitation';
  const fromParam = Number(searchParams.get('from') || 2000);
  const toParam = Number(searchParams.get('to') || 2025);

  const [variables, setVariables] = useState<VariableDto[]>([]);
  const [objects, setObjects] = useState<GeoObjectDto[]>([]);
  const [objectA, setObjectA] = useState<string>('chuy_reg');
  const [objectB, setObjectB] = useState<string>('batken_reg');
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);

  const [pairData, setPairData] = useState<ComparePairResponseDto | null>(null);
  const [tableRows, setTableRows] = useState<ObjectTrendTableRowDto[]>([]);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([apiClient.getVariables(), apiClient.getObjects()])
      .then(([vars, objs]) => {
        setVariables(vars);
        setObjects(objs);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const promise = isAutoMode
      ? apiClient.getCompareAuto({ variable: variableParam, from: fromParam, to: toParam })
      : apiClient.getCompareManual({
          variable: variableParam,
          a: objectA,
          b: objectB,
          from: fromParam,
          to: toParam,
        });

    promise
      .then((res) => {
        setPairData(res);
        setObjectA(res.object_a.series.object_code);
        setObjectB(res.object_b.series.object_code);
      })
      .catch(console.error);

    apiClient
      .getTrendsTable({ variable: variableParam, from: fromParam, to: toParam })
      .then(setTableRows)
      .catch(console.error);
  }, [variableParam, fromParam, toParam, objectA, objectB, isAutoMode]);

  const sortedRows = [...tableRows].sort((x, y) => {
    const aVal = x.sen_slope ?? 0;
    const bVal = y.sen_slope ?? 0;
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Панель управления сравнением (Ф6.1, Ф6.2, Ф6.4) */}
      <section className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono uppercase text-[#0284C7] font-semibold">
              Функция Ф6 • Контрастное сравнение регионов и объектов
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Сравнение объектов с противоположными трендами
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoMode(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#0B1F3A] hover:bg-[#0284C7] text-white text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Автоподбор пары с противоположным трендом</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Сравниваемый параметр
            </label>
            <select
              value={variableParam}
              onChange={(e) => {
                setIsAutoMode(true);
                setSearchParams({ variable: e.target.value, from: String(fromParam), to: String(toParam) });
              }}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-medium bg-white"
            >
              {variables.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.name} ({v.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Объект А (можно заменить вручную)
            </label>
            <select
              value={objectA}
              onChange={(e) => {
                setIsAutoMode(false);
                setObjectA(e.target.value);
              }}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-medium bg-white"
            >
              {objects.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Объект Б (можно заменить вручную)
            </label>
            <select
              value={objectB}
              onChange={(e) => {
                setIsAutoMode(false);
                setObjectB(e.target.value);
              }}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-medium bg-white"
            >
              {objects.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pairData && (
          <div className="p-3.5 rounded bg-sky-50/70 border border-sky-200 text-xs sm:text-sm text-slate-900 font-medium">
            {pairData.comparison_summary}
          </div>
        )}
      </section>

      {/* Два графика рядом с общей шкалой времени, на телефоне — друг под другом (Ф6.3, раздел 11) */}
      {pairData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[pairData.object_a, pairData.object_b].map((item, idx) => (
            <div key={idx} className="space-y-3 bg-white border border-slate-200 rounded-md p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    {idx === 0 ? 'Объект А' : 'Объект Б'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{item.series.object_name}</h3>
                </div>
                <TrendBadge trend={item.trend.trend} pValue={item.trend.p_value} />
              </div>

              <TrendChart series={item.series} trend={item.trend} height={260} />

              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed">
                {item.trend.summary_text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Таблица всех объектов с сортировкой для поиска районов риска (Ф6.5) */}
      <section className="bg-white border border-slate-200 rounded-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900">
            Сводная таблица трендов по всем объектам (поиск районов риска)
          </h3>
          <button
            type="button"
            onClick={() => setSortAsc((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Сортировать по скорости изменения</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-mono">
                <th className="py-2.5 px-3">Объект / Регион</th>
                <th className="py-2.5 px-3">Направление и значимость</th>
                <th className="py-2.5 px-3">Наклон Сена (скорость)</th>
                <th className="py-2.5 px-3">p-value</th>
                <th className="py-2.5 px-3">Тау Кендалла</th>
                <th className="py-2.5 px-3">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRows.map((row) => (
                <tr key={row.object_code} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{row.object_name}</td>
                  <td className="py-2.5 px-3">
                    <TrendBadge trend={row.trend} pValue={row.p_value} />
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    {row.sen_slope !== null
                      ? `${row.sen_slope > 0 ? '+' : ''}${row.sen_slope} ${row.unit}/год`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono">{row.p_value ?? '—'}</td>
                  <td className="py-2.5 px-3 font-mono">{row.tau ?? '—'}</td>
                  <td className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/explore?object=${row.object_code}&variable=${variableParam}`)
                      }
                      className="text-[#0284C7] font-semibold hover:underline"
                    >
                      Открыть анализ →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
```

---

### 3) `frontend/src/App.tsx` и `frontend/src/main.tsx`

#### `frontend/src/App.tsx`
```tsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePhenomenaPage } from './pages/HomePhenomenaPage';
import { ExploreResultPage } from './pages/ExploreResultPage';
import { ComparePage } from './pages/ComparePage';
import { getUseMocksMode, setUseMocksMode } from './api/client';

export const App: React.FC = () => {
  const [useMocks, setUseMocks] = useState<boolean>(getUseMocksMode());

  const handleToggleMocks = () => {
    const next = !useMocks;
    setUseMocksMode(next);
    setUseMocks(next);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-slate-900">
        <Navbar useMocks={useMocks} onToggleMocks={handleToggleMocks} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePhenomenaPage />} />
            <Route path="/explore" element={<ExploreResultPage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            NASA Space Apps Challenge 2026 • Челлендж Earth System Trend Detective (Кыргызстан)
          </span>
          <span className="font-mono">
            Источники: NASA GLDAS • GPM IMERG • MODIS AppEEARS • GRACE • CNES Hydroweb • NOAA
          </span>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
```

#### `frontend/src/main.tsx`
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 4. Запускаем!

В терминале внутри папки `frontend` выполни:

```bash
npm run dev
```

Открой в браузере **`http://localhost:5173`** — и сразу увидишь:
1. **Вкладка «Глобальные явления и карта» (`/`)**: интерактивная карта Кыргызстана с белыми выносками-флажками в стиле постера **SWOT**, который скинул тимлид, плюс правая панель сравнения местного тренда с глобальным трендом NOAA.
2. **Вкладка «Исследовать объект» (`/explore`)**: сквозной сценарий **«Вода → Озеро Иссык-Куль → Уровень воды → 2000–2025»** с выводом простыми словами, графиком годового и месячного рядов, пунктирной линией тренда Сена, блоком «Подробнее» с подсказками и **карточками цепочки со стрелками** внизу.
3. **Вкладка «Сравнение регионов» (`/compare`)**: два графика рядом (Чуйская vs Баткенская область) и таблица районов риска с сортировкой.

Если при сборке вылезет хотя бы одна ошибка в консоли — скинь её сюда, поправим за секунду.