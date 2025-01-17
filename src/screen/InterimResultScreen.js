import React from 'react';

const rankNames = { 1: '大富豪', 2: '富豪', 3: '大貧民' };

const InterimResultScreen = ({ results, onNextGame }) => (
  <div>
    <h2>途中リザルト</h2>
    <ul>
      {results.map(result => (
        <li key={result.id}>
          {result.name}：階級 {result.beforeRank !== null ? ` ${rankNames[result.beforeRank]}` : '平民'} - スコア: {result.score}
        </li>
      ))}
    </ul>
    <button onClick={onNextGame}>次のゲーム</button>
  </div>
);

export default InterimResultScreen;