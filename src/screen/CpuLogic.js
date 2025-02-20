// cpuLogic.js
const jokerSuits = ['0', '9'];
const jokerValue = '99';
const eightValue = '06';

// 特定のカードを優先して出す
const prioritizeCards = (patterns, isRevolution) => {
  // 優先度に基づいてpatternsを並び替える
  return patterns.sort((a, b) => {
    const aFirstTwo = a[0].slice(0, 2);
    const bFirstTwo = b[0].slice(0, 2);

    // 1. 革命中の場合、先頭2桁が'13'となるカードの優先度を最後にする
    //    革命状態でない場合は、先頭2桁が'01'かつ'011'でないカードの優先度を最後にする
    if (isRevolution) {
      if (aFirstTwo === '13') return 1;
      if (bFirstTwo === '13') return -1;
    } else {
      if (aFirstTwo === '01' && aFirstTwo !== '011') return 1;
      if (bFirstTwo === '01' && bFirstTwo !== '011') return -1;
    }

    // 2. eightValueとjokerValueの優先度を最後から2番目にする。両方ある場合の優先度は等しい
    const aContainsOnlyEightOrJoker = a.every(card => card.slice(0, 2) === eightValue || card.slice(0, 2) === jokerValue);
    const bContainsOnlyEightOrJoker = b.every(card => card.slice(0, 2) === eightValue || card.slice(0, 2) === jokerValue);
    if (aContainsOnlyEightOrJoker && !bContainsOnlyEightOrJoker) return 1;
    if (bContainsOnlyEightOrJoker && !aContainsOnlyEightOrJoker) return -1;

    // 3. 先頭2桁がjokerValueであるcardを含まないカードの優先順位を高くする
    const aContainsJoker = a.some(card => card.slice(0, 2) === jokerValue);
    const bContainsJoker = b.some(card => card.slice(0, 2) === jokerValue);
    if (aContainsJoker && !bContainsJoker) return 1;
    if (bContainsJoker && !aContainsJoker) return -1;

    // 4. カードのlengthの降順に並べる
    if (b.length !== a.length) {
      return b.length - a.length;
    }

    // 5. 革命中の場合、カードの先頭2桁の降順に並べる。革命状態でない場合は昇順
    if (isRevolution) {
        const aLastTwo = a[a.length - 1].slice(0, 2);
        const bLastTwo = b[b.length - 1].slice(0, 2);
        return parseInt(bLastTwo, 10) - parseInt(aLastTwo, 10);
    }
    return parseInt(aFirstTwo, 10) - parseInt(bFirstTwo, 10);
  });
};

// 特定のカードを交換に出す
const determineExchangeCard = (hand, playerRank) => {
  if (playerRank === 3) {
    // handsの中の先頭2桁が最大のデータの中からランダムで1件返却
    const maxCardValue = Math.max(...hand.map(card => parseInt(card.value, 10)));
    const maxCards = hand.filter(card => parseInt(card.value, 10) === maxCardValue);
    const targetCard = maxCards[Math.floor(Math.random() * maxCards.length)];
    return `${targetCard.value}${targetCard.suit}`;
  }
  if (playerRank === 1) {
    // handsから、「8」「A」「2」「Joker」を除外
    const filteredHand = hand.filter(card => ![eightValue, '12', '13', jokerValue].includes(card.value));
    const patterns = getPatterns(filteredHand);

    // パターンの中身が1件、「3」以外のパターンが存在する場合
    const singleCardPatterns = patterns.filter(pattern => pattern.length === 1 && pattern[0].slice(0, 2) !== '01');
    if (singleCardPatterns.length > 0) {
      return singleCardPatterns.reduce((min, pattern) => pattern[0].slice(0, 2) < min[0].slice(0, 2) ? pattern : min)[0];
    }

    // パターンの中身が1件のデータが、「3」のみである場合
    const only01Pattern = patterns.find(pattern => pattern.length === 1 && pattern[0].slice(0, 2) === '01');
    if (only01Pattern) {
      return only01Pattern[0];
    }

    // パターンの中身が全て2件以上の場合
    const multiCardPatterns = patterns.filter(pattern => pattern.length > 1 && pattern[0].slice(0, 2) !== '01');
    if (multiCardPatterns.length > 0) {
      const minPattern = multiCardPatterns.reduce((min, pattern) => pattern[0].slice(0, 2) < min[0].slice(0, 2) ? pattern : min);
      return minPattern[Math.floor(Math.random() * minPattern.length)];
    }
  }
};

// 場にカードが出せる場合、必ず出す
const getPlayableCards = (hand, fieldCard, isRevolution, currentSuits) => {
  let patterns = getPatterns(hand);
  // 優先度順に並び替え
  patterns = prioritizeCards(patterns, isRevolution);

  const patternIndex = getCanPlayCard(patterns, fieldCard, isRevolution, currentSuits);
  if (patternIndex !== null) {
    return patterns[patternIndex];
  }
  return null;
};

// 手札から出せるカードを取得
const getCanPlayCard = (patterns, fieldCard, isRevolution, currentSuits) => {
  // 場にカードがない場合はOKとする
  if (fieldCard.length === 0) return 0;

  const numbers = fieldCard.map(card => card.slice(0, 2));
  const uniqueNumbers = new Set(numbers.filter(card => card !== jokerValue));
  const uniqueSuit = new Set(fieldCard.map(card => card.slice(2)).filter(suit => !jokerSuits.includes(suit)));
  const minNum = Math.min(...numbers.map(num => parseInt(num, 10)));
  const maxNumExcludedJoker = Math.max(...numbers.map(num => num === jokerValue ? 0 : parseInt(num, 10)));
  let returnIndex = null;
  let prohibitedFinish = 0;
  const targetMax = isRevolution ? '01' : '13';

  patterns.forEach((pattern, index) => {
    if (pattern.length !== fieldCard.length) return;

    if (
      pattern.some(card => [jokerValue, targetMax].includes(card.slice(0, 2))) ||
      pattern.every(card => ([jokerValue, eightValue].includes(card.slice(0, 2)) || card === '011'))
    ) {
      prohibitedFinish = index;
    }
    if (numbers.length === 1 && numbers[0] === jokerValue && pattern[0] === '011') {
      prohibitedFinish = index;
      returnIndex = index;
      return;
    }

    const patternNums = pattern.map(card => card.slice(0, 2));
    const patternSuits = pattern.map(card => card.slice(2));
    const minPatternNum = Math.min(...patternNums.map(num => parseInt(num, 10)));
    const maxPatternNumExcludedJoker = Math.max(...patternNums.map(num => num === jokerValue ? 0 : parseInt(num, 10)));
    // 属性のチェック(同数or階段)
    const uniquePatternNums = new Set(patternNums.filter(card => card !== jokerValue));
    const uniquePatternSuits = new Set(patternSuits.filter(card => !jokerSuits.includes(card)));
    if (uniquePatternNums.size === 1 && uniquePatternNums.size !== uniqueNumbers.size) {
      return;
    };
    if (uniquePatternSuits.size === 1 && uniquePatternSuits.size !== uniqueSuit.size) {
      return
    }

    // スート縛りのチェック
    if (currentSuits.length > 0 && !patternSuits.every(suit => (currentSuits.includes(suit)) || jokerSuits.includes(suit))) {
      return;
    }

    // 値のチェック
    if (isRevolution) {
      if (maxPatternNumExcludedJoker < maxNumExcludedJoker) {
        returnIndex = index;
      }
      return;
    }
    if (minNum < minPatternNum) {
      returnIndex = returnIndex === null ? index : returnIndex;
      return;
    }
  });
  if (returnIndex !== null && prohibitedFinish < returnIndex) {
    return null;
  }
  return returnIndex;
};

// 手札からパターンを取得する関数
const getPatterns = (cards) => {
  const patterns = [];
  const jokers = cards.filter(card => card.value === jokerValue);
  const nonJokers = cards.filter(card => card.value !== jokerValue);
  // 同じ数字のパターン
  const sameValuePatterns = nonJokers.reduce((acc, card) => {
    acc[card.value] = acc[card.value] || [];
    acc[card.value].push(`${card.value}${card.suit}`);
    return acc;
  }, {});
  for (const value in sameValuePatterns) {
    // 8、スペード3は、単品としても追加
    if (sameValuePatterns[value].includes('011')) {
      patterns.push(sameValuePatterns[value].filter(card => card === '011'));
    }
    if (sameValuePatterns[value].some(card => card.slice(0, 2) === eightValue)) {
      sameValuePatterns[value].forEach(card => patterns.push([card]));
    }

    patterns.push(sameValuePatterns[value]);
    if (sameValuePatterns[value].length > 0 && jokers.length > 0) {
      patterns.push([...sameValuePatterns[value], `${jokers[0].value}${jokers[0].suit}`]);
      if (!patterns.includes(`${jokers[0].value}${jokers[0].suit}`)) patterns.push([`${jokers[0].value}${jokers[0].suit}`]);
    }
  }

  // 階段のパターン
  const sortedCards = nonJokers.sort((a, b) => a.suit - b.suit);
  let isUseJoker = false;
  for (let i = 0; i < sortedCards.length - 1; i++) {
    let sequence = [`${sortedCards[i].value}${sortedCards[i].suit}`];
    isUseJoker = false;
    for (let j = i + 1; j < sortedCards.length; j++) {
      const checkValue = parseInt(sortedCards[j].value, 10);
      const checkSuit = sortedCards[j].suit;
      if (checkValue === parseInt(sortedCards[i].value, 10) + sequence.length && checkSuit === sortedCards[i].suit) {
        sequence.push(`${sortedCards[j].value}${sortedCards[j].suit}`);
      } else if (jokers.length > 0 && !isUseJoker) {
        sequence.push(`${jokers[0].value}${jokers[0].suit}`);
        isUseJoker = true;
        // Jokerを追加した場合、+2した値を検査
        if (checkValue === parseInt(sortedCards[i].value, 10) + sequence.length && checkSuit === sortedCards[i].suit) {
          sequence.push(`${sortedCards[j].value}${sortedCards[j].suit}`);
        }
      } else {
        break;
      }
    }
    if (sequence.length >= 3) {
      patterns.push(sequence);
    }
  }
  return patterns;
};

export { getPlayableCards, getPatterns, determineExchangeCard };
