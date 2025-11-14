// /api/check.js
// [최종] fetch 대신 axios를 사용해 SSL 오류를 해결하는 버전

const https = require('https');
const axios = require('axios'); // 1. axios를 불러옵니다.

// 2. SSL 인증서 확인을 건너뛰는 '에이전트' 생성 (이전과 동일)
const unsafeAgent = new https.Agent({
  rejectUnauthorized: false 
});

module.exports = async (request, response) => {
    
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
        // 6. fetch 대신 axios로 API 호출
        const apiResponse = await axios.post(apiUrl, apiRequestBody, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            // 7. axios에 SSL 건너뛰기 에이전트 적용
            httpsAgent: unsafeAgent 
        });

        // 8. 성공 시 (axios는 2xx가 아닌 응답을 에러로 던짐)
        // apiResponse.data에 JSON 결과가 들어있습니다.
        response.status(200).json(apiResponse.data);

    } catch (error) {
        // 9. 모든 axios 에러 잡기
        console.error('Bareun API (axios) fetch error object:', error);
        
        // axios 에러 객체에서 더 자세한 정보 추출
        const errorData = {
            error: "axios fetch failed",
            message: error.message,
            cause: error.cause ? String(error.cause) : 'No specific cause'
        };

        // '바른 API' 자체가 4xx/5xx 에러를 보낸 경우
        if (error.response) {
            errorData.api_status = error.response.status;
            errorData.api_data = error.response.data;
        }

        response.status(500).json(errorData);
    }
};
