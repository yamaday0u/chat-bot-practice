# chat-bot-practice

## 起動方法

1. 依存パッケージをインストールします。

   ```bash
   npm install
   ```

2. 環境変数ファイルを作成します。

   ```bash
   cp .env.example .env.local
   ```

3. `.env.local` を開き、`ANTHROPIC_API_KEY` に API キーを入力します。

   ```
   ANTHROPIC_API_KEY=your-api-key
   ```

4. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

5. ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。
