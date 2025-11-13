// DOM(문서)이 모두 로드되었을 때 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {

    // 1. HTML에서 필요한 요소들을 가져옵니다.
    const textInput = document.getElementById('textInput');
    const checkButton = document.getElementById('checkButton');
    const resultArea = document.getElementById('resultArea');

    // 2. '검사하기' 버튼에 클릭 이벤트 리스너를 추가합니다.
    checkButton.addEventListener('click', () => {
        const text = textInput.value;

        // 텍스트가 비어있으면 검사하지 않습니다.
        if (text.trim() === '') {
            resultArea.innerHTML = '<p>검사할 텍스트를 입력해주세요.</p>';
            return;
        }

        // 3. 로딩 상태를 표시합니다.
        resultArea.innerHTML = '<p>검사 중입니다...</p>';
        checkButton.disabled = true; // 버튼 비활성화

        // 4. [가상] 맞춤법 검사 API 호출 시뮬레이션
        // 실제로는 이 부분에서 fetch()를 사용해 외부 API로 text를 보냅니다.
        fakeSpellCheckAPI(text)
            .then(correctedHtml => {
                // 5. 성공 시 결과 표시
                resultArea.innerHTML = correctedHtml;
                checkButton.disabled = false; // 버튼 활성화
            })
            .catch(error => {
                // 6. 실패 시 에러 표시
                console.error('API 호출 오류:', error);
                resultArea.innerHTML = '<p>오류가 발생했습니다. 다시 시도해주세요.</p>';
                checkButton.disabled = false; // 버튼 활성화
            });
    });

    /**
     * [시뮬레이션 함수]
     * 실제 API를 호출하는 대신, 1초 후에 미리 준비된 결과를 반환합니다.
     * * @param {string} text - 사용자가 입력한 원본 텍스트
     * @returns {Promise<string>} - 수정된 내용이 포함된 HTML 문자열을 반환
     */
    function fakeSpellCheckAPI(text) {
        console.log("가상 API로 전송된 텍스트:", text);

        return new Promise((resolve) => {
            // 네트워크 지연 시뮬레이션 (1초)
            setTimeout(() => {
                // 원본 텍스트를 기반으로 가상 결과 생성
                // 예시: '잘못된'이라는 단어를 찾아서 CSS 클래스를 적용
                let processedHtml = text.replace(
                    /잘못된/g, 
                    '<span class="error-highlight" title="[수정 제안] 잘못된 → 틀린">잘못된</span>'
                );

                // 예시: '오탈자'라는 단어를 찾아서 CSS 클래스 적용
                processedHtml = processedHtml.replace(
                    /오탈자/g, 
                    '<span class="error-highlight" title="[수정 제안] 오탈자 → 오탈자(誤脫字)">오탈자</span>'
                );
                
                // 줄바꿈(newline)을 <br> 태그로 변환하여 HTML에 표시
                processedHtml = processedHtml.replace(/\n/g, '<br>');

                // '검사 완료:' 메시지와 함께 결과 반환
                const finalHtml = `<p><strong>검사 완료:</strong></p>${processedHtml}`;
                resolve(finalHtml);

            }, 1000); // 1초 지연
        });
    }

    // [참고] 만약 실제 API를 사용한다면 이 함수는 이런 모습이 됩니다.
    /*
    async function realSpellCheckAPI(text) {
        const apiKey = "YOUR_API_KEY"; // 실제 API 키
        const apiUrl = "https://api.example.com/spellcheck"; // 실제 API 주소

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ query: text })
        });

        if (!response.ok) {
            throw new Error('네트워크 응답이 올바르지 않습니다.');
        }

        const data = await response.json(); // API 응답 (JSON 형태)
        
        // 이 데이터를 가공해서 HTML로 만드는 로직이 필요합니다.
        const processedHtml = processApiData(data); 
        return processedHtml;
    }
    */
});
