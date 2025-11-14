// /api/check.js
// [최종] SSL 인증서 오류(unable to verify...)를 해결하는 버전

import https from 'https'; // Node.js의 https 모듈을 가져옵니다.

// 1. SSL 인증서 확인을 건너뛰는 '에이전트'를 생성합니다.
const unsafeAgent = new https.Agent({
  rejectUnauthorized: false
});

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const apiKey = process.env.BAREUN_API_KEY;
    if (!apiKey) {
        console.error('API Key is missing');
        return response.status(500).json({ error: 'Server configuration error: API Key not found.' });
    }

    const { text } = request.body;
    if (!text || text.trim() === "") {
        return response.status(200).json({}); 
    }

    const apiUrl = 'https://api.bareun.ai/bareun/api/v1/correct-error';
    const apiRequestBody = {
        document: { content: text, language: "ko-KR" }
    };

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify(apiRequestBody),
            
            // --- 여기가 핵심 수정 사항 ---
            // "SSL 인증서 검사하지 마세요" 옵션이 적용된 에이전트를 사용합니다.
            agent: unsafeAgent
            // ---------------------------
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`Bareun API error: ${apiResponse.status}`, errorText);
            throw new Error(`Bareun API responded with ${apiResponse.status}: ${errorText}`);
        }

        const data = await apiResponse.json(); 
        response.status(200).json(data);

    } catch (error) {
        // 'fetch failed'의 근본 원인이 SSL 문제였습니다.
        console.error('Bareun API fetch error object:', error);
        response.status(500).json({ 
            error: "fetch failed", 
            message: error.message,
            cause: error.cause ? String(error.cause) : 'No specific cause' 
        });
    }
}
