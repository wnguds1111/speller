// app.js
// [바른 API 테스트용] 응답받은 JSON 원본을 출력하는 버전

document.addEventListener('DOMContentLoaded', () => {
    // ... (요소 가져오는 코드는 동일) ...
    const textInput = document.getElementById('textInput');
    const resetButton = document.getElementById('resetButton');
    const copyButton = document.getElementById('copyButton');
    const checkButton = document.getElementById('checkButton');
    const resultCard = document.getElementById('resultCard');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContent = document.getElementById('resultContent');

    // ... (resetButton, copyButton 클릭 이벤트 리스너는 동일) ...
    resetButton.addEventListener('click', () => { /* 이전 코드와 동일 */ });
    copyButton.addEventListener('click', () => { /* 이전 코드와 동일 */ });


    checkButton.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (text === '') {
            displayResult('no_input');
            return;
        }

        loadingIndicator.style.display = 'block';
        resultContent.style.display = 'none';
        checkButton.disabled = true;
        resetButton.disabled = true;
        copyButton.disabled = true;

        try {
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text }),
            });

            // 500, 404 등 서버 에러
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server function error:', errorData);
                throw new Error(`서버 함수 호출 실패: ${response.statusText}`);
            }
            
            // '바른 API'가 반환한 JSON 객체
            const bareunData = await response.json(); 
            
            // *** 여기가 핵심 ***
            // JSON이 비어있는지 확인
            if (Object.keys(bareunData).length === 0 && bareunData.constructor === Object) {
                displayResult('no_error'); // 텍스트가 비어있을 때 (빈 객체 반환)
            } else {
                // 성공! JSON 데이터를 결과 창에 출력
                displayResult('json_success', bareunData);
            }

        } catch (error) {
            console.error('맞춤법 검사 중 오류 발생:', error);
            displayResult('api_error');
        } finally {
            loadingIndicator.style.display = 'none';
            checkButton.disabled = false;
            resetButton.disabled = false;
            copyButton.disabled = false;
        }
    });

    // --- 결과 표시 함수 (JSON 출력용) ---
    function displayResult(type, data = null) {
        resultContent.style.display = 'block';
        resultContent.innerHTML = ''; 

        let headerHtml = '';
        let bodyHtml = '';

        if (type === 'no_input') {
            headerHtml = `... (생략 - 이전 코드와 동일) ...`;
            bodyHtml = `... (생략 - 이전 코드와 동일) ...`;
        } else if (type === 'no_error') {
            headerHtml = `... (생략 - 이전 코드와 동일) ...`;
            bodyHtml = `... (생략 - 이전 코드와 동일) ...`;
        
        } else if (type === 'json_success' && data) {
            // *** 여기가 핵심 ***
            // 성공한 JSON 원본을 그대로 <pre> 태그에 담아 출력
            headerHtml = `
                <div class="result-header success-header">
                    <h3><i class="fas fa-check-circle"></i> API 호출 성공!</h3>
                </div>`;
            bodyHtml = `
                <div class="result-body" style="text-align: left; background-color: #f8f8f8;">
                    <p>아래는 '바른 API'로부터 받은 원본 응답입니다:</p>
                    <pre style="white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(data, null, 2)}</pre>
                </div>`;
                
        } else if (type === 'api_error') {
             headerHtml = `... (생략 - 이전 코드와 동일) ...`;
            bodyHtml = `... (생략 - 이전 코드와 동일) ...`;
        }
        
        // (생략된 부분은 이전 코드에서 복사해서 사용하세요)
        resultContent.innerHTML = headerHtml + bodyHtml;
    }
    
    // (생략된 버튼 리스너 등은 이전 코드와 동일하게 복사)
    resetButton.addEventListener('click', () => {
        textInput.value = '';
        resultContent.innerHTML = '';
        resultContent.style.display = 'none';
        resultCard.style.minHeight = '150px';
    });
    copyButton.addEventListener('click', () => {
        textInput.select();
        document.execCommand('copy');
        alert('텍스트가 클립보드에 복사되었습니다!');
    });
});
