// /api/check.js
// [최종] '바른 API'의 올바른 엔드포인트(URL)로 수정한 버전

const https = require('https');
const axios = require('axios'); // axios 사용

// SSL 인증서 확인을 건너뛰는 '에이전트'
const unsafeAgent = new https.Agent({
  rejectUnauthorized: false 
});

module.exports = async (request, response) => {
    
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // 1. API 키 확인
    const apiKey = process.env.BAREUN_API_KEY;
    if (!apiKey) {
        console.error('API Key is missing');
        return response.status(500).json({ error: 'Server configuration error: API Key not found.' });
    }

    // 2. 텍스트 확인
    const { text } = request.body;
    if (!text || text.trim() === "") {
        return response.status(200).json({}); 
    }

    // --- 여기가 수정되었습니다! (공식 문서의 올바른 주소) ---
    const apiUrl = 'https://api.bareun.ai/bareun.RevisionService/CorrectError';
    // -----------------------------------------------------

    // '바른 API'가 요구하는 JSON 형식
    const apiRequestBody = {
        document: { content: text, language: "ko-KR" }
    };

    try {
        // 3. axios로 API 호출 (SSL 건너뛰기 적용)
        const apiResponse = await axios.post(apiUrl, apiRequestBody, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            httpsAgent: unsafeAgent 
        });

        // 4. 성공 시 JSON 데이터 반환
        response.status(200).json(apiResponse.data);

    } catch (error) {
        // 5. 모든 axios 에러 잡기
        console.error('Bareun API (axios) fetch error object:', error);
        
        const errorData = {
            error: "axios fetch failed",
            message: error.message,
            cause: error.cause ? String(error.cause) : 'No specific cause'
        };

        if (error.response) {
            // 404 에러가 또 뜬다면 이 주소도 틀린 것입니다.
            errorData.api_status = error.response.status;
            errorData.api_data = error.response.data;
        }

        response.status(500).json(errorData);
    }
};
