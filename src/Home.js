import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const history = useNavigate();

  const startGame = () => {
    history.push('/game');
  };

  return (
    <div>
      <h1>Welcome to Daifugo Game</h1>
      <button onClick={startGame}>Start Game</button>
        <p>実装が必要な画面</p>
        <ul>
          <li>トップ画面</li>
          <li>ゲーム画面</li>
          <li>リザルト画面※中間報告</li>
          <li>最終結果画面※リザルト画面と統合できるかも</li>
        </ul>
        <p>各画面で最低限必要な機能</p>
        <p>トップ画面</p>
        <ul>
          <li>タイトルラベル</li>
          <li>スタートボタン</li>
        </ul>
        <p>ゲーム画面</p>
        <ul>
          <li>自プレイヤーのカード情報※選択可能</li>
          <li>他プレイヤーのカード枚数</li>
          <li>各プレイヤーの階級</li>
          <li>場に出ているカード</li>
          <li>場、およびフィールドの状態※革命か、とか縛りとか</li>
          <li>パスをしたかのステータス</li>
          <li>カードを出すボタン</li>
          <li>パスするボタン</li>
        </ul>
        <p>リザルト画面※中間報告</p>
        <ul>
          <li>プレイヤー</li>
          <li>次のゲームの階級</li>
          <li>得点※加算点と累計</li>
          <li>強制終了ボタン※なるべく小さめに作る</li>
          <li>次のゲーム実施ボタン</li>
        </ul>
        <p>最終結果画面</p>
        <ul>
          <li>プレイヤー情報</li>
          <li>順位</li>
          <li>点数累計</li>
          <li>もう一度やるボタン</li>
          <li>トップ画面に戻るボタン</li>
        </ul>
    </div>
  );
};

export default Home;
