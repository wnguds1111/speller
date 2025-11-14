// /api/check.js
// [최종] CJS(require) 문법으로 SSL 인증서 오류를 해결하는 버전

// ESM 'import' 대신 CJS 'require'를 사용합니다.
const https = require('https'); 

// 1. SSL 인증서 확인을 건너뛰는 '에이전트'를 생성합니다.
const unsafeAgent = new https.Agent({
  rejectUnauthorized: false // SSL 인증서 검증 안 함
});

// ESM 'export default' 대신 CJS 'module.exports'를 사용합니다.
module.exports = async (request, response) => {
    
    // 2. POST 요청 확인
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // 3. API 키 확인
    const apiKey = process.env.BAREUN_API_KEY;
    if (!apiKey) {
        console.error('API Key is missing');
        return response.status(500).json({ error: 'Server configuration error: API Key not found.' });
    }

    // 4. 텍스트 확인
    // body에서 text를 구조분해할당
    const { text } = request.body;
    if (!text || text.trim() === "") {
        return response.status(200).json({}); 
    }

    // 5. '바른 API' 정보
    const apiUrl = 'https://api.bareun.ai/bareun/api/v1/correct-error';
    const apiRequestBody = {
        document: { content: text, language: "ko-KR" }
    };

    try {
        // 6. API 호출 (SSL 검증 비활성화)
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify(apiRequestBody),
            
            // "SSL 인증서 검사하지 마세요" 옵션이 적용된 에이전트를 사용합니다.
            agent: unsafeAgent
        });

        // 7. API 응답 확인
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`Bareun API error: ${apiResponse.status}`, errorText);
            throw new Error(`Bareun API responded with ${apiResponse.status}: ${errorText}`);
        }

        // 8. 성공 시 JSON 반환
        const data = await apiResponse.json(); 
        response.status(200).json(data);

    } catch (error) {
        // 9. 모든 에러 잡기
        console.error('Bareun API fetch error object:', error);
        response.status(500).json({ 
            error: "fetch failed", 
            message: error.message,
            cause: error.cause ? String(error.cause) : 'No specific cause' 
        });
    }
};
