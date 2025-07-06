import React, { useState, useEffect } from 'react';
import './App.css';

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

// 🔧 正規化関数：短縮形やピリオド、スペース、大文字小文字に対応
const normalize = (str) =>
  (str || "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/\s+/g, ' ')
    .replace(/[''‛`´]/g, "'")
    .replace(/she is/g, "she's")
    .replace(/he is/g, "he's")
    .replace(/they are/g, "they're")
    .replace(/we are/g, "we're")
    .replace(/i am/g, "i'm")
    .replace(/that is/g, "that's")
    .replace(/it is/g, "it's");

const datasetOptions = {
  IELTS: [
    { value: "data1", label: "家族" },
    { value: "data2", label: "コミュニケーション" },
    { value: "data3", label: "テクノロジー" },
    { value: "data4", label: "休日" },
    { value: "data5", label: "文化" },
    { value: "data6", label: "食べ物" },
    { value: "data7", label: "教育" },
    { value: "data8", label: "言語" },
    { value: "data9", label: "場所" },
    { value: "data10", label: "仕事" },
    { value: "data11", label: "お金" },
    { value: "data12", label: "感情" },
  ],
  TVshow: [
    { value: "data1", label: "PrisonBreak Season 1-1" },
    { value: "data2", label: "PrisonBreak Season 1-2" },
  ],
  Eiken :[
    {value:"data1",label:"長文でわからなかったやつ"}
  ]
};

function App() {
  const [category, setCategory] = useState("IELTS");
  const [dataset, setDataset] = useState("data1");
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [choices, setChoices] = useState([]);
  const [showChoices, setShowChoices] = useState(false);
  const [wrongWords, setWrongWords] = useState(() => {
    const saved = localStorage.getItem('wrongWords');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const [restartTrigger, setRestartTrigger] = useState(false);
  const [mode, setMode] = useState("multiple");
  const [inputValue, setInputValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false); // 新機能：ノート表示
  const [learningType, setLearningType] = useState("all"); // 学習タイプ（all, word, phrase など）

useEffect(() => {
  setLoading(true);
  fetch(`http://127.0.0.1:5050/api/words?category=${category}&dataset=${dataset}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      // 学習タイプでフィルタリング
      let filteredData = data;
      if (learningType !== "all") {
        filteredData = data.filter(item => item.type === learningType);
      }
      
      const shuffled = shuffle(filteredData).slice(0, questionCount);
      setQuestions(shuffled);
      setCurrent(0);
      setSelected(null);
      setScore(0);
      setIsFinished(false);
      setShowChoices(false);
      setLoading(false);
      setInputValue("");
      setShowNotes(false);
    })
    .catch(err => {
      console.error("Fetch失敗:", err);
      setLoading(false);
    });
}, [category, dataset, questionCount, restartTrigger, learningType]);

  const question = questions[current];

  useEffect(() => {
    if (!question || mode !== "multiple") return;
    const allAnswers = questions.map(q => q.answer);
    const wrong = shuffle(allAnswers.filter(ans => ans !== question.answer)).slice(0, 3);
    const mixed = shuffle([...wrong, question.answer]);
    setChoices(mixed);
    setShowChoices(false);
  }, [question, mode]);

  const handleChoice = (choice) => {
    setSelected(choice);
    if (choice === question.answer) {
      setScore(score + 1);
    } else {
      const updatedWrong = [...wrongWords, question];
      setWrongWords(updatedWrong);
      localStorage.setItem('wrongWords', JSON.stringify(updatedWrong));
    }
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setIsFinished(true);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setShowChoices(false);
      setInputValue("");
      setShowHint(false);
      setShowNotes(false);
    }
  };

  const handleClearWrongWords = () => {
    localStorage.removeItem('wrongWords');
    setWrongWords([]);
  };

  const handleRestart = () => {
    setRestartTrigger(prev => !prev);
  };

  const handleSentenceInput = () => {
    const trimmed = inputValue.trim();
    if (trimmed === "") return;

    if (normalize(trimmed) === normalize(question?.sentence)) {
      setScore(score + 1);
    } else {
      const updatedWrong = [...wrongWords, question];
      setWrongWords(updatedWrong);
      localStorage.setItem('wrongWords', JSON.stringify(updatedWrong));
    }
    setSelected(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && selected === null) {
      handleSentenceInput();
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>;

  if (isFinished) {
    return (
      <div className="app-container">
        <h1>クイズ終了！</h1>
        <p>スコア：{score} / {questions.length}</p>

        {wrongWords.length > 0 && (
          <>
            <h3>間違った単語一覧：</h3>
            <ul>
              {wrongWords.map((q, i) => (
                <li key={i}>
                  <strong>「{q.word}」</strong> → {q.answer}
                  {q.notes && (
                    <div style={{ fontSize: '0.8em', color: '#888', marginTop: '0.25rem' }}>
                      💡 {q.notes}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <button className="button" onClick={handleClearWrongWords}>間違えた単語をクリア</button>
          </>
        )}

        <button className="button" onClick={handleRestart}>もう一度</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1>オリジナル英単語</h1>
      <button
         className="button"
         onClick={() => setShowSettings(prev => !prev)}
         style={{ marginBottom: '1rem' }}
      >
        <span>⚙️</span>
      {showSettings ? "設定を隠す" : "設定を表示"}
      </button>

      {showSettings && (
  <div className="settings-panel">
    <label>カテゴリ：
      <select value={category} onChange={(e) => {
        setCategory(e.target.value);
        setDataset(datasetOptions[e.target.value][0].value);
      }}>
        <option value="IELTS">IELTS</option>
        <option value="TVshow">PrisonBreak</option>
        <option value="Eiken">Eiken</option>
      </select>
    </label>
    <label>モード：
      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="multiple">4択モード</option>
        <option value="sentence">例文入力モード</option>
      </select>
    </label>
    <label>学習タイプ：
      <select value={learningType} onChange={(e) => setLearningType(e.target.value)}>
        <option value="all">混合モード</option>
        <option value="word">単語のみ</option>
        <option value="phrase">フレーズのみ</option>
      </select>
    </label>
    <br />
    <label>単語帳：
      <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
        {datasetOptions[category].map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
    <br />
    <label>問題数：
      <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
        <option value={10}>10問</option>
        <option value={20}>20問</option>
        <option value={50}>50問</option>
      </select>
    </label>
  </div>
    )}

      <p>スコア: {score} / {questions.length}</p>
      
      {/* 現在の学習タイプ表示 */}
      {learningType !== "all" && (
        <div style={{ 
          backgroundColor: '#e8f4f8', 
          padding: '0.5rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          fontSize: '0.9em',
          color: '#2c5282',
          textAlign: 'center'
        }}>
          📚 {learningType === "word" ? "単語学習モード" : "フレーズ学習モード"}
        </div>
      )}

      {question && (
        <>


          {mode === "multiple" ? (
            <>
              <div className="question" onClick={() => !showChoices && setShowChoices(true)}>
                「{question.word}」の意味は？
                {!showChoices && <p style={{ fontSize: '1.5rem', color: '#888' }}>クリックで選択肢を表示</p>}
              </div>

              {showChoices && choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(choice)}
                  className={`button ${
                    selected === null ? '' :
                    choice === question.answer ? 'correct' :
                    choice === selected ? 'wrong' : ''
                  }`}
                  disabled={selected !== null}
                >
                  {choice}
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="question">
                日本語の例文から英語を入力してください：
                <p><strong>{question.sentence_jp}</strong></p>

                {!showHint ? (
                  <button className="button" onClick={() => setShowHint(true)}>ヒントを見る</button>
                ) : (
                  <p style={{ color: "#888", fontStyle: "italic" }}>
                    ※ ヒント: 「{question.word}」を使って英文を作ってください
                  </p>
                )}

              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={selected !== null}
                className="input"
              />
              {selected === null && (
                <button className="button" onClick={handleSentenceInput}>答える</button>
              )}
            </>
          )}

          {/* 補足情報（ノート）表示ボタン */}
          {question.notes && (
            <div style={{ marginTop: '1rem' }}>
              <button 
                className="button" 
                onClick={() => setShowNotes(prev => !prev)}
                style={{ 
                  backgroundColor: '#e8f4f8',
                  color: '#2c5282',
                  fontSize: '0.9em'
                }}
              >
                💡 {showNotes ? "補足情報を隠す" : "補足情報を見る"}
              </button>
              {showNotes && (
                <div style={{ 
                  backgroundColor: '#f7fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  padding: '1rem', 
                  marginTop: '0.5rem',
                  fontSize: '0.9em',
                  color: '#4a5568'
                }}>
                  <strong>💡 補足情報:</strong><br />
                  {question.notes}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="result">
          {mode === "multiple" ? (
            selected === question.answer ? (
              <p style={{ color: 'green' }}>✅ 正解！</p>
            ) : (
              <p style={{ color: 'red' }}>❌ 不正解（正解は: {question.answer}）</p>
            )
          ) : (
            normalize(selected) === normalize(question?.sentence) ? (
              <p style={{ color: 'green' }}>✅ 正解！</p>
            ) : (
              <p style={{ color: 'red' }}>❌ 不正解（正解は: {question.sentence}）</p>
            )
          )}
          
          <button className="button" onClick={handleNext}>次の問題へ</button>
          
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p><strong>例文:</strong> {question.sentence}</p>
            <p><strong>日本語:</strong> {question.sentence_jp}</p>
            
            {/* 結果画面でもノート表示 */}
            {question.notes && (
              <div style={{ 
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#e8f4f8',
                borderRadius: '4px',
                fontSize: '0.9em'
              }}>
                <strong>💡 補足:</strong> {question.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;