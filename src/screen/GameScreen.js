import React, { useState, useEffect } from 'react';
import { initializeDeck, shuffleDeck } from '../components/Deck';
import Card, { getValueByKey } from '../components/Card';
import { getPlayableCards, determineExchangeCard } from './CpuLogic';

const rankScores = { 1: 6, 2: 3, 3: 0 };
const lastRankScores = { 1: 8, 2: 3, 3: 0 };
const rankNames = { 1: '大富豪', 2: '平民', 3: '大貧民' };
const specialNumber = { eight: '06', spadeTree: '011', joker: '99' };
const suitMark = {1: '♤', 2: '♢', 3: '♡'};

// デッキを配布する関数
const distributeCards = (deck) => {
  const players = Array.from({ length: 3 }, () => []);

/*
  // 階級テストなど、すぐに結果を確認したい時用テストコード
  while (deck.length > 30) {
    for (let i = 0; i < 3; i++) {
      if (deck.length > 0) {
        players[i].push(deck.shift());
      }
    }
  }
  return players;
*/
  while (deck.length > 0) {
    for (let i = 0; i < 3; i++) {
      if (deck.length > 0) {
        players[i].push(deck.shift());
      }
    }
  }

  return players;
};

// 手札をソートする関数
const sortHand = (hand) => {
  return hand.sort((a, b) => (a.value + a.suit) - (b.value + b.suit));
};

const GameScreen = ({ onGameEnd, round, blindCard, blindCardIndex, initialPlayers }) => {
  const [players, setPlayers] = useState([...initialPlayers]); // プレイヤー情報
  const [deck, setDeck] = useState([]); // 全体のデッキ情報
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(null); // プレイヤーのターン判定用値
  const [fieldCard, setFieldCard] = useState([]); // 場に出ている最新のカード
  const [fieldNum, setFieldNum] = useState(0); // 場に出ている最新のカードの数字
  const [fieldCardStock, setFieldCardStock] = useState([]); // 場に出ている全てのカード
  const [isValidSelection, setIsValidSelection] = useState(false); // 選択したカードが出せるかの判定に使用
  const [rankCounter, setRankCounter] = useState(1); // 順位を管理するカウンター
  const [exchangeCards, setExchangeCards] = useState({ player1: null, player3: null }); // 交換するカードを管理
  const [exchangeCardForPlayer3, setExchangeCardForPlayer3] = useState(99); // 大貧民が交換可能なカードを管理
  const [isStartGame, setIsStartGame] = useState(false); // ゲームを開始する判定に使用
  const [lastPlayerId, setLastPlayerId] = useState(null); // 最後にカードを出したプレイヤーのIDを管理
  const [passedPlayerIds, setPassedPlayerIds] = useState([]); // パスをしたプレイヤーのIDを管理
  const [isRevolution, setIsRevolution] = useState(false); // 革命状態を管理
  const [currentSuits, setCurrentSuits] = useState([]); // 縛りのスートを管理

  // 初期表示処理
  useEffect(() => {
    initializeGame();
  }, [round]);

  // ゲームを初期化する関数
  const initializeGame = () => {
    let newDeck = deck;
    let mainDeck = initializeDeck();
    const firstDeck = mainDeck.slice(0, blindCardIndex);
    const secondDeck = mainDeck.slice(blindCardIndex + 1);
    newDeck = shuffleDeck(firstDeck.concat(secondDeck));
    newDeck = distributeCards(newDeck);
    const newPlayers = players.map((player, index) => ({
      ...player,
      key: index,
      hand: sortHand(newDeck[index]),
    }));
    setDeck(newDeck);
    setPlayers(newPlayers);
    checkExchangeConditions(newPlayers);
  };

  // カード交換の条件を確認する関数
  const checkExchangeConditions = (newPlayers) => {
    const player1 = newPlayers.find(player => player.beforeRank === 1);
    const player3 = newPlayers.find(player => player.beforeRank === 3);
    setIsStartGame(!(player1 && player3));
    if (player1 && player3) {
      if (player1.isCpu) {
        setExchangeCards(prev => ({ ...prev, player1: determineExchangeCard(player1.hand, 1) }));
      } else {
        setExchangeCards(prev => ({ ...prev, player1: null }));
      }
      if (player3.isCpu) {
        setExchangeCards(prev => ({ ...prev, player3: determineExchangeCard(player3.hand, 3) }));
      } else {
        // ここの処理を変更
        const maxCardValue = Math.max(...player3.hand.map(card => parseInt(card.value, 10)));
        const maxCards = player3.hand.filter(card => parseInt(card.value, 10) === maxCardValue);
        if (maxCards.length > 1) {
          // 最大値のカードが複数ある場合
          setExchangeCards(prev => ({ ...prev, player3: null }));
          setExchangeCardForPlayer3(maxCardValue);
          // 他のカードは選択しても選択状態にしない
          player3.hand = player3.hand.map(card => ({
            ...card,
          }));
        } else {
          // 最大値のカードが1件の場合
          setExchangeCards(prev => ({ ...prev, player3: `${maxCards[0].value}${maxCards[0].suit}` }));
        }
      }
    } else {
      const randomPlayerIndex = Math.floor(Math.random() * newPlayers.length);
      setPlayers(newPlayers);
      setCurrentPlayerIndex(randomPlayerIndex);
    }
  };

  // カード選択処理
  const handleCardSelection = (playerId, card) => {
    if (!(playerId === 'player3' || playerId === 'player1')) {
      return;
    }
    if (playerId === 'player3' && parseInt(card.slice(0, 2), 10) !== exchangeCardForPlayer3) {
      return;
    }
    setExchangeCards(prev => ({ ...prev, [playerId]: card }));
  };

  // カード交換処理
  const handleExchange = () => {
    const player1 = players.find(player => player.beforeRank === 1);
    const player3 = players.find(player => player.beforeRank === 3);
    const selectedCard1 = exchangeCards.player1;
    const selectedCard3 = exchangeCards.player3;
    const updatedPlayers = players.map((player, index) => {
      if (player.id === player1.id) {
        player.hand = player.hand.filter(card => `${card.value}${card.suit}` !== selectedCard1);
        player.hand.push({ value: selectedCard3.slice(0, -1), suit: selectedCard3.slice(-1) });
        player.hand = sortHand(player.hand);
      } else if (player.id === player3.id) {
        player.hand = player.hand.filter(card => `${card.value}${card.suit}` !== selectedCard3);
        player.hand.push({ value: selectedCard1.slice(0, -1), suit: selectedCard1.slice(-1) });
        player.hand = sortHand(player.hand);
        setCurrentPlayerIndex(index);
      }
      return player;
    });
    setPlayers(updatedPlayers);
    setIsStartGame(true);
  };

  // カード押下時処理
  // 自プレイヤーの場合、押下したカードの選択状態を切り替える
  const handleCardClick = (playerId, cardIndex) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => {
        if (player.id === playerId) {
          const targetCard = `${player.hand[cardIndex].value}${player.hand[cardIndex].suit}`;

          const newSelectedHand = player.selectedHand.includes(targetCard)
            ? []
            : [...player.selectedHand, targetCard];
          return { ...player, selectedHand: newSelectedHand };
        }
        return player;
      })
    );
  };

  // CPUのターン処理
  const handleCpuTurn = (cpuPlayer) => {
    setTimeout(() => {
      const cardToPlay = getPlayableCards(cpuPlayer.hand, fieldCard, isRevolution, currentSuits);
      if (cardToPlay === null) {
        handlePass();
      } else {
        handleOutPutCard(cpuPlayer.id, cardToPlay);
      }
    }, 1500);
  };

  // カードを出すボタン制御
  const validateSelection = (selectedHand) => {
    if (selectedHand.length === 0) return false;
/*
    // どんな札でも出せるようにしたい時用テストコード
    return true;
*/
    if (fieldCard.length !== 0 && selectedHand.length !== fieldCard.length) return false;
    // スペ3返し判定
    if (fieldCard.length === 1 && String(fieldCard[0]).startsWith(specialNumber.joker) && selectedHand[0] === specialNumber.spadeTree) return true;
    const numbers = selectedHand.map(card => card.slice(0, 2));
    const suits = selectedHand.map(card => card.slice(2));
    const uniqueNumbers = new Set(numbers);
    const uniqueSuits = new Set(suits);
    // スート縛りがある場合確認
    if (currentSuits.length > 0) {
      const isSameSuit = suits.every(suit => currentSuits.includes(suit) || suit === '9' || suit === '0');
      if (!isSameSuit) return false;
    }
    // Jokerが含まれている場合
    if (uniqueNumbers.has(specialNumber.joker)) {
      const jokerIndex = numbers.indexOf(specialNumber.joker);
      if (uniqueNumbers.size === 2) {
        numbers[jokerIndex] = jokerIndex === 0 ? numbers[1] : numbers[0];
        uniqueNumbers.clear();
        numbers.forEach(num => uniqueNumbers.add(num));
      }
      if (uniqueSuits.size === 2) {
        suits[jokerIndex] = jokerIndex === 0 ? suits[1] : suits[0];
        uniqueSuits.clear();
        suits.forEach(su => uniqueSuits.add(su));
      }
    }
    const minNum = Math.min(...numbers.map(num => parseInt(num, 10)));
    const maxNumExcludedJoker = Math.max(...numbers.map(num => num === specialNumber.joker ? 0 :parseInt(num, 10)));
    if (isRevolution) {
      if (fieldNum !== 0 && fieldNum <= maxNumExcludedJoker) return false;
    } else {
      if (minNum <= fieldNum) return false;
    }
    if (uniqueNumbers.size === 1) {
      const fieldUniqueNumbers = new Set(fieldCard.map(card => card.slice(0, 2)).filter(num => num !== specialNumber.joker));
      return fieldUniqueNumbers.size === 0 || uniqueNumbers.size === fieldUniqueNumbers.size;
    };
    if (uniqueSuits.size === 1) {
      const fielduniqueSuits = new Set(fieldCard.map(card => card.slice(2)).filter(suit => suit !== '9'));
      if (fielduniqueSuits.size === 0 || uniqueSuits.size === fielduniqueSuits.size) return checkIsStraight(numbers, uniqueNumbers.has(specialNumber.joker))
    };
    return false;
  };

  // カードを出す処理
  const handleOutPutCard = (playerId, cardToPlay) => {
    const newPlayers = [...players];
    let newFieldCard = [];
    let isReset = false;
    let isFinish = false;
    newPlayers.forEach((newPlayer, index) => {
      if (newPlayer.id === playerId) {
        const hands = cardToPlay ? cardToPlay : newPlayer.selectedHand;
        newPlayer.hand = newPlayer.hand.filter((card) => !(hands.includes(`${card.value}${card.suit}`)));
        newFieldCard.push(...hands);
        newPlayer.selectedHand = [];
        // 手札を出し切った場合、順位を設定
        if (newPlayer.hand.length === 0 && newPlayer.rank === null) {
          isFinish = true;
          // 禁止上がりか否かで順位を修正
          if (handleProhibitedFinish(hands)) {
            alert('禁止上がり');
            if (newPlayers.some(player => player.rank === 3)) {
              // 既に大貧民がいる場合は平民とする
              newPlayer.rank = 2;
              newPlayer.beforeRank = 2;
            } else {
              newPlayer.rank = 3;
              newPlayer.beforeRank = 3;
            }
          } else {
            newPlayer.rank = rankCounter;
            // 都落ち処理
            handleMiyakoOchi(newPlayers);
            newPlayer.beforeRank = rankCounter;
            setRankCounter(rankCounter + 1);
          }
        }

        // 革命の判定
        if (handleRevolution(hands)) {
          // 革命が発生した場合の処理
          alert('革命');
        }
        const numbers = hands.map(card => card.slice(0, 2));
        const uniqueNumbers = new Set(numbers);
        // 8切り判定
        if (numbers.includes(specialNumber.joker)) {
          const start = numbers.indexOf(specialNumber.joker);
          numbers.splice(start, 1);
          uniqueNumbers.clear();
          numbers.forEach(num => uniqueNumbers.add(num));
        }
        if (uniqueNumbers.size === 1 && numbers[0] === specialNumber.eight) {
          let handMarks = [];
          hands.forEach(hand => handMarks.push(getValueByKey(hand)));
          alert('8切り：' + handMarks.join(' '));
          isReset = true;
        }
        // スペ3返し判定
        if (fieldCard.length === 1 && String(fieldCard[0]).startsWith(specialNumber.joker) && hands[0] === specialNumber.spadeTree) {
          alert('スペ3返し');
          isReset = true;
        }

        // 縛り判定※8切り、スペ3返しの場合は場が流れるため採用しない
        if (!isReset && handleShibari(hands)) {
          let handSuits = [];
          hands.forEach(hand => handSuits.push(suitMark[parseInt(hand.slice(2))]));
          alert('縛り' + handSuits.join(' '));
        }
        setLastPlayerId(playerId); // 最後にカードを出したプレイヤーのIDを更新
      }
    });
    // プレイヤーのターンを更新
    let remainingPlayers = newPlayers.filter(player => player.rank === null);
    let outputCardPlayers = newPlayers.filter(player => (player.rank === null && !passedPlayerIds.includes(player.id)));
    if (remainingPlayers.length === 1) {
      // 最後の一人になった場合、そのプレイヤーに現在最下位の順位を設定
      if (newPlayers.some(player => player.rank === 3)) {
        if (newPlayers.some(player => player.rank === 2)) {
          // 既に大貧民、平民がいる場合は大富豪とする
          remainingPlayers[0].rank = 1;
          remainingPlayers[0].beforeRank = 1;
        } else {
          // 既に大貧民がいる場合は平民とする
          remainingPlayers[0].rank = 2;
          remainingPlayers[0].beforeRank = 2;
        }
      } else {
        remainingPlayers[0].rank = 3;
        remainingPlayers[0].beforeRank = 3;
      }
      setRankCounter(rankCounter + 1);
      newPlayers.forEach((newPlayer) => {
        newPlayer.isMyTurn = false;
      });
    } else if (isReset || (outputCardPlayers.length === 1 && newPlayers[currentPlayerIndex].id === lastPlayerId)) {
      let nextPlayerIndex = currentPlayerIndex;
      if (isFinish) {
        nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        while (newPlayers[nextPlayerIndex].rank !== null) {
          nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
        }
      }
      resetField(newPlayers[nextPlayerIndex].id);
      setCurrentPlayerIndex(nextPlayerIndex);
    } else {
      let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      const nextPlayerIndexIfAllPass = newPlayers[nextPlayerIndex].rank === null ? nextPlayerIndex : (nextPlayerIndex + 1) % players.length;
      let loopCount = 0;
      while (newPlayers[nextPlayerIndex].rank !== null || passedPlayerIds.includes(newPlayers[nextPlayerIndex].id)) {
        nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
        loopCount++;
        if (players.length < loopCount) {
          nextPlayerIndex = nextPlayerIndexIfAllPass;
          resetField(newPlayers[nextPlayerIndex].id);
          break;
        }
      }
      setCurrentPlayerIndex(nextPlayerIndex);
    }
    setPlayers(newPlayers);
    if (!isReset) {
      // プレイヤー情報と場の最新カードを更新
      setFieldCard(newFieldCard);
      setFieldNum(getMinFieldCardValue(newFieldCard));
      let newFieldCardStock = [...fieldCardStock];
      newFieldCardStock.push(newFieldCard);
      setFieldCardStock(newFieldCardStock);
    }
  };

  // パス処理
  const handlePass = () => {
    /**
     * 以下の条件の場合、プレイヤー1のターンで流れない仕様
     * プレイヤー1がカードを出す→プレイヤー2がカードを出して上がる→プレイヤー3がパスをする
     */
    const newPlayers = [...players];
    let newPassedPlayerIds = [...passedPlayerIds];
    newPassedPlayerIds.push(newPlayers[currentPlayerIndex].id);
    setPassedPlayerIds(newPassedPlayerIds);
    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const checkIndex = (element) => element.id === lastPlayerId;
    const lastPlayerIndex = newPlayers.findIndex(checkIndex);
    const nextPlayerIndexIfAllPass = newPlayers[lastPlayerIndex].rank === null ? lastPlayerIndex : (lastPlayerIndex + 1) % players.length;
    let loopCount = 0;
    while (newPlayers[nextPlayerIndex].rank !== null || newPassedPlayerIds.includes(newPlayers[nextPlayerIndex].id)) {
      nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
      loopCount++;
      if (players.length < loopCount) {
        nextPlayerIndex = nextPlayerIndexIfAllPass;
        break;
      }
    }
    // 次のプレイヤーが最後にカードを出したプレイヤーの場合
    if (newPlayers[nextPlayerIndex].id === lastPlayerId) {
      if (newPlayers[nextPlayerIndex].rank !== null) {
        setCurrentPlayerIndex(nextPlayerIndex);
        setPlayers(newPlayers);
        return;
      }
      resetField(lastPlayerId);
    } else if (newPlayers.length < loopCount) {
      // ループ数が既定値を上回った場合もリセットする
      resetField(lastPlayerId);
    }
    setCurrentPlayerIndex(nextPlayerIndex);
    setPlayers(newPlayers);
  };

  // ラウンド終了処理
  const handleEndRound = () => {
    const newResults = players.map(player => ({
      ...player,
      score: player.score + (round === 4 ? lastRankScores[player.rank] : rankScores[player.rank]),
    }));
    setPlayers(newResults);
    onGameEnd(newResults);
  };

  // 出したカードの中から最小の値を取得
  const getMinFieldCardValue = (fieldCard) => {
    if (fieldCard.length === 0) {
      return 0;
    }
    const cardValues = fieldCard.map(card => parseInt(card.slice(0, 2), 10));
    const minCardValue = Math.min(...cardValues);
    return minCardValue;
  };

  // 階段の判定
  const checkIsStraight = (numbers, jokerIncluded) => {
    const sortedNumbers = numbers.map(num => parseInt(num, 10)).sort((a, b) => a - b);
    let isStraight = false;
    if (jokerIncluded) {
      let isUseJoker = false;
      for (let i = 0; i < sortedNumbers.length - 2; i++) {
        if (sortedNumbers[i + 1] - sortedNumbers[i] > 2) {
          return false;
        }
        if (sortedNumbers[i + 1] - sortedNumbers[i] === 2 && isUseJoker) {
          return false;
        }
        if (sortedNumbers[i + 1] - sortedNumbers[i] === 2) {
          isUseJoker = true;
          isStraight = true;
          continue;
        }
        if (sortedNumbers[i + 1] - sortedNumbers[i] === 1) {
          isStraight = true;
        }
      }
      return isStraight;
    }
    for (let i = 0; i < sortedNumbers.length - 2; i++) {
      isStraight = sortedNumbers[i + 1] - sortedNumbers[i] === 1 && sortedNumbers[i + 2] - sortedNumbers[i + 1] === 1;
    }
    return isStraight;
  };

  // ローカルルール設定
  // 革命
  const handleRevolution = (selectedHand) => {
    const numbers = selectedHand.map(card => card.slice(0, 2));
    const uniqueNumbers = new Set(numbers);
    if (numbers.includes(specialNumber.joker)) {
      const start = numbers.indexOf(specialNumber.joker);
      numbers.splice(start, 1);
      uniqueNumbers.clear();
      numbers.forEach(num => uniqueNumbers.add(num));
    }
    if (uniqueNumbers.size === 1 && selectedHand.length >= 3) {
      setIsRevolution(!isRevolution); // 革命状態を反転
      return true;
    }
    return false;
  };
  // フィールドリセット
  const resetField = (playerId) => {
    setFieldCard([]);
    setFieldNum(0);
    setFieldCardStock([]);
    setLastPlayerId(playerId);
    setPassedPlayerIds([]);
    setCurrentSuits([]);
  }
  // 都落ち
  const handleMiyakoOchi = (newPlayers) => {
    const formerDaifugo = newPlayers.find(player => player.beforeRank === 1);
    const currentDaifugo = newPlayers.find(player => player.rank === 1);
    if (formerDaifugo && currentDaifugo && formerDaifugo.id !== currentDaifugo.id) {
      alert('都落ち');
      if (newPlayers.some(player => player.rank === 3)) {
        // 既に大貧民がいる場合は平民とする
        formerDaifugo.rank = 2;
        formerDaifugo.beforeRank = 2;
      } else {
        formerDaifugo.rank = 3;
        formerDaifugo.beforeRank = 3;
      }
    }
  };
  // 縛り
  const handleShibari = (selectedHand) => {
    if (currentSuits.length > 0) return false;
    const suits = selectedHand.map(card => card.slice(2)).sort();
    const fieldSuits = fieldCard.map(card => card.slice(2)).sort();
    if (fieldCard.length !== 0 && Array(suits).toString() === Array(fieldSuits).toString()) {
      setCurrentSuits([...suits]);
      return true;
    }
    return false;
  };
  // 禁止上がり判定
  const handleProhibitedFinish = (selectedHand) => {
    const maxCard = isRevolution ? '01' : '13'; // 革命時は最小カードが禁止
    if (selectedHand.some(card => card.startsWith(specialNumber.joker)) ||
        selectedHand.some(card => card.slice(0, 2) === maxCard) ||
        selectedHand.every(card => Object.values(specialNumber).includes(card.slice(0, 2))) ||
        (selectedHand.length === 1 && selectedHand[0] === specialNumber.spadeTree)
      ) {
      return true;
    }
    return false;
  };

  // カードを出すボタンの活性状態更新
  useEffect(() => {
    const currentPlayer = players.find(player => player.isMyTurn);
    if (currentPlayer) {
      setIsValidSelection(validateSelection(currentPlayer.selectedHand));
    }
  }, [players]);

  // CPU判定
  useEffect(() => {
    if (currentPlayerIndex === null) return;
    const newPlayers = [...players];
    newPlayers.forEach((newPlayer, index) => {
      newPlayer.isMyTurn = (index === currentPlayerIndex && newPlayer.rank === null);
    });
    setPlayers(newPlayers);
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer.isCpu) {
      handleCpuTurn(currentPlayer);
    }
  }, [currentPlayerIndex, passedPlayerIds]);

  return (
    <div>
      {players.every(player => player.rank !== null) && (
        <div>
          <h2>ラウンド {round}</h2>
          <button onClick={handleEndRound}>次のラウンドへ</button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {players.filter(player => player.isCpu).map((player, index) => (
          <div key={player.id}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {player.hand.map((card, cardIndex) => (
                <Card
                  key={cardIndex}
                  mark={`${card.value}${card.suit}`}
                  isUser={player.isShow}
                  isSelected={player.selectedHand.includes(`${card.value}${card.suit}`)}
                  onClick={() => handleCardClick(player.id, cardIndex)}
                  style={{
                    width: '40px',
                  }}
                />
              ))}
            </div>
            <div style={{ border: player.isMyTurn ? '2px solid blue' : 'none', padding: '10px', margin: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {passedPlayerIds.includes(player.id) && player.rank === null && (
                  <div style={{ position: 'absolute' }}>
                      <img src={require(`../images/pass.png`)} alt="PASS" />
                  </div>
              )}
              <h3>{player.name}：{player.beforeRank !== null ? `階級 ${rankNames[player.beforeRank]}` : '-'}  {player.hand.length}枚</h3>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
        <div style={{ width: '500px', height: '350px', border: '1px solid #ccc', padding: '10px', position: 'relative' }}>
          <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px', paddingTop: 0 }}>
            <h3>場に出されたカード</h3>
            {isRevolution &&
              <h3>革命</h3>
            }
            {currentSuits.length > 0 &&
              <h3>縛り：
              {currentSuits.map((suit) => (
                `${suitMark[suit]}`
              ))}
              </h3>
            }
          </div>
          {fieldCardStock.map((cardGroup, groupIndex) => {
            let rotation;
            if (groupIndex % 3 === 1) {
              rotation = 20 + (groupIndex % 10);
            } else if (groupIndex % 3 === 2) {
              rotation = -20 - (groupIndex % 10);
            } else {
              rotation = groupIndex % 2 === 0 ? -(groupIndex % 10) : groupIndex % 10;
            }
            const offset = (groupIndex % 10) * -2;
            const cardLenfth = cardGroup.length;

            return (
              <div
                key={groupIndex}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '45%',
                  transform: `translate(-50%, -50%) rotate(${rotation}deg) translate(${offset}px, ${offset}px)`,
                }}
              >
                {cardGroup.map((card, cardIndex) => (
                  <Card
                    key={cardIndex}
                    mark={`${card}`}
                    isUser={true}
                    style={{
                      position: 'relative', // カードの位置を固定
                      width: cardLenfth > 4 ? '40px' : '60px'
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ margin: 'auto 30px 0' }}>
          <h5>ブラインドカード</h5>
          <div style={{width: '20px'}}>
            <Card
              mark={`${blindCard.value}${blindCard.suit}`}
              isUser={false}
            />
          </div>
        </div>
      </div>
      {players.filter(player => !player.isCpu).map((player) => (
        <div key={player.id}>
          <div style={{ border: player.isMyTurn ? '2px solid blue' : 'none', padding: '10px', margin: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {passedPlayerIds.includes(player.id) && player.rank === null && (
                <div style={{ position: 'absolute' }}>
                    <img src={require(`../images/pass.png`)} alt="PASS" />
                </div>
            )}
            <h3>{player.name}：{player.beforeRank !== null ? `階級 ${rankNames[player.beforeRank]}` : '-'}  {player.hand.length}枚</h3>
          </div>
          {isStartGame && (
            <div style={{ display: 'flex' }}>
              {player.hand.map((card, cardIndex) => (
                  <Card
                    mark={`${card.value}${card.suit}`}
                    isUser={player.isShow}
                    isSelected={player.selectedHand.includes(`${card.value}${card.suit}`)}
                    onClick={() => handleCardClick(player.id, cardIndex)}
                    style={{
                      width: '70px',
                    }}
                  />
              ))}
            </div>
          )}
          {isStartGame && player.isMyTurn && (
            <button onClick={() => handlePass()} disabled={fieldCard.length === 0}>パス</button>
          )}
          {isStartGame && player.isMyTurn && player.isUser &&
            <button onClick={() => handleOutPutCard(player.id)} disabled={!isValidSelection}>カードを出す</button>
          }
          {!isStartGame && (
            <div style={{ display: 'flex' }}>
              {player.beforeRank === 1 && (
                <div>
                  <h4>好きなカードを選択してください</h4>
                  {player.hand.map((card, cardIndex) => (
                    <Card
                      key={cardIndex}
                      mark={`${card.value}${card.suit}`}
                      isUser={player.isUser}
                      isSelected={exchangeCards.player1 !== null && exchangeCards.player1.includes(`${card.value}${card.suit}`)}
                      onClick={() => handleCardSelection('player1', `${card.value}${card.suit}`)}
                      style={{
                        width: '70px',
                      }}
                    />
                  ))}
                </div>
              )}
              {player.beforeRank === 2 && (
                <div>
                  <h4>カードを交換するボタンを押下してください</h4>
                  {player.hand.map((card, cardIndex) => (
                    <Card
                      key={cardIndex}
                      mark={`${card.value}${card.suit}`}
                      isUser={player.isUser}
                      style={{
                        width: '70px',
                        }}
                    />
                  ))}
                </div>
              )}
              {player.beforeRank === 3 && (
                <div>
                  <h4>強いカードを選択してください</h4>
                  {player.hand.map((card, cardIndex) => (
                    <Card
                      key={cardIndex}
                      mark={`${card.value}${card.suit}`}
                      isUser={player.isUser}
                      isSelected={exchangeCards.player3 !== null && exchangeCards.player3 === `${card.value}${card.suit}`}
                      onClick={() => handleCardSelection('player3', `${card.value}${card.suit}`)}
                      style={{
                        width: '70px',
                      }}
                      />
                  ))}
                </div>
              )}
            </div>
          )}
          {!isStartGame && player.isUser && exchangeCards.player1 && exchangeCards.player3 && (
            <button onClick={handleExchange}>カードを交換する</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default GameScreen;
