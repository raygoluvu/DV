# DV 專案

本專案為一個以 D3.js 為主的互動式資料視覺化平台，主要針對台灣各城市不同交通方式（如公車、捷運、高鐵）進行多維度資料分析與視覺化展示。

## 專案結構

- `index.html`：網頁主入口
- `script.js`：資料處理與互動式視覺化邏輯
- `style.css`：網頁樣式
- `test.csv`、`tw-transportation.csv`：範例資料集
- `output.png`：分析或視覺化結果範例圖
- Jupyter Notebooks（`*.ipynb`）：資料分析與實驗記錄
- `requirements.txt`：Python 套件需求（供 Notebook 使用）

## 快速開始

### 環境需求

- Python 3.x（執行 Jupyter Notebook）
- Node.js（如需使用 npm 套件）
- 現代網頁瀏覽器

### 安裝步驟

1. 下載專案：

   ```bash
   git clone https://github.com/raygoluvu/DV.git
   ```
2. （選用）安裝 Python 套件：

   ```bash
   pip install -r requirements.txt
   ```
3. （選用）安裝 Node.js 套件：

   ```bash
   npm install
   ```

### 使用方式

- 直接以瀏覽器開啟 `index.html` 進行互動式資料視覺化。
- 若需進行資料分析，可執行 Jupyter Notebook：

  ```bash
  jupyter notebook
  ```
- 可使用內建 CSV 檔案或自行更換資料。

## 檔案說明

- **index.html**：網頁應用主入口。
- **script.js**：負責資料載入、處理與互動式視覺化。
- **style.css**：網頁樣式設定。
- **test.csv**、**tw-transportation.csv**：範例資料集。
- **requirements.txt**：Jupyter Notebook 相關 Python 套件需求。
- **output.png**：分析或視覺化結果範例圖。
- **Jupyter Notebooks**：資料分析、實驗與結果記錄。

## 功能面細節

### 1. 互動式雷達圖（Radar Chart）

- 以 D3.js 動態繪製多城市、多交通方式（如公車、捷運、高鐵）之雷達圖。
- 支援多城市勾選，圖表即時更新。
- 圖表區塊、圓點皆有滑鼠提示（Tooltip），顯示詳細數值。

### 2. 年份與月份篩選

- 具備年份與月份範圍滑桿，使用者可自訂資料區間，圖表即時反映篩選結果。

### 3. 城市選擇面板

- 以勾選框方式列出所有城市，支援多選，並可即時切換顯示。

### 4. 交通方式細部分析

- 點擊雷達圖的交通方式標籤，可切換至該交通方式的折線圖（Line Chart）分析。
- 折線圖顯示各城市於不同月份的趨勢變化，支援動畫顯示。

### 5. 動態圖例與顏色標示

- 每個城市皆有對應顏色，圖例會隨勾選城市動態更新。
- 圖例與圖表顏色一致，方便辨識。

### 6. 響應式互動

- 所有篩選（年份、月份、城市）與圖表切換皆為即時互動，無需重新整理頁面。
- 支援返回主圖表的按鈕。

### 7. 資料處理

- 內建資料過濾、加總、分組等處理邏輯，確保圖表顯示正確。
- 支援多交通方式、多城市、多時間區間的彈性查詢。
