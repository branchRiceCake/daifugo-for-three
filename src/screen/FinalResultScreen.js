import React from 'react';
import Card from '../components/Card';

const FinalResultScreen = ({ finalResults, blindCard, onRestart }) => (
  <div>
    <h2>最終リザルト</h2>
    <ul>
      {finalResults.map(result => (
        <li key={result.id}>
          {result.name}：最終スコア: {result.score}
        </li>
      ))}
    </ul>
    <div>
      <h3>ブラインドカード</h3>
      <Card mark={`${blindCard.value}${blindCard.suit}`} isUser={true} style={{ width: '70px' }} />
    </div>
    <button onClick={onRestart}>終了</button>
  </div>
);

export default FinalResultScreen;