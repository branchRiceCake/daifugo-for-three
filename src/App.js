import React, { useState } from 'react';
import StartScreen from './screen/StartScreen';
import GameScreen from './screen/GameScreen';
import InterimResultScreen from './screen/InterimResultScreen';
import FinalResultScreen from './screen/FinalResultScreen';
import { initializeDeck, shuffleDeck } from './components/Deck';

const initialPlayers = [
  { id: 1, name: 'Player 1', hand: [], selectedHand: [], score: 0, isCpu: false, isUser: true, isMyTurn: false, rank: null, beforeRank: null },
  { id: 2, name: 'CPU 1', hand: [], selectedHand: [], score: 0, isCpu: true, isUser: false, isMyTurn: false, rank: null, beforeRank: null },
  { id: 3, name: 'CPU 2', hand: [], selectedHand: [], score: 0, isCpu: true, isUser: false, isMyTurn: false, rank: null, beforeRank: null },
];

const App = () => {
  const [phase, setPhase] = useState('start');
  const [results, setResults] = useState([]);
  const [round, setRound] = useState(1);
  const [blindCard, setBlindCard] = useState(null);
  const [blindCardIndex, setBlindCardIndex] = useState(0);

  const handleStart = () => {
    // デッキを初期化
    let newDeck = initializeDeck();
    // ブラインドカードを設定
    const blindIndex = Math.floor(Math.random() * (newDeck.length - 1)); // ジョーカーを除外
    const blindCard = newDeck.splice(blindIndex, 1)[0];

    // シャッフル
    newDeck = shuffleDeck(newDeck);
    setBlindCardIndex(blindIndex);
    setBlindCard(blindCard);

    setPhase('game');
  };

  const handleGameEnd = (newResults) => {
    newResults = newResults.map((result) => ({
      ...result,
      beforeRank: result.rank,
      rank: null,
    }));
    setResults([...results, newResults]);
    if (round < 4) {
      setPhase('interim');
    } else {
      setPhase('final');
    }
  };

  const handleNextGame = () => {
    setRound(round + 1);
    setPhase('game');
  };

  const handleRestart = () => {
    setPhase('start');
    setRound(1);
    setResults([]);
    setBlindCardIndex(0);
    setBlindCard(null);
  };

  const getInitialPlayers = () => {
    if (results.length === 0) {
      return initialPlayers;
    }
    const lastResults = results[results.length - 1];
    return initialPlayers.map(player => {
      const lastResult = lastResults.find(result => result.id === player.id);
      return {
        ...player,
        score: lastResult ? lastResult.score : player.score,
        beforeRank: lastResult ? lastResult.beforeRank : player.beforeRank,
        rank: null,
        isMyTurn: false,
      };
    });
  };

  return (
    <div>
      {phase === 'start' && <StartScreen onStart={handleStart} />}
      {phase === 'game' && <GameScreen onGameEnd={handleGameEnd} round={round} blindCard={blindCard} blindCardIndex={blindCardIndex} initialPlayers={getInitialPlayers()} />}
      {phase === 'interim' && <InterimResultScreen results={results[results.length - 1]} onNextGame={handleNextGame} />}
      {phase === 'final' && <FinalResultScreen finalResults={results[results.length - 1]} blindCard={blindCard} onRestart={handleRestart} />}
    </div>
  );
};

export default App;