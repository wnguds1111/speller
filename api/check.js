// /api/check.js
// [디버깅용] fetch failed의 세부 원인을 로깅하는 버전

export default async function handler(request, response) {
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

    // 3. '바른 API' 정보
    const apiUrl = 'https://api.bareun.ai/bareun/api/v1/correct-error';
    const apiRequestBody = {
        document: { content: text, language: "ko-KR" }
    };

    try {
        // 4. API 호출
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify(apiRequestBody)
        });

        // 5. API 응답 확인
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`Bareun API error: ${apiResponse.status}`, errorText);
            throw new Error(`Bareun API responded with ${apiResponse.status}: ${errorText}`);
        }

        // 6. 성공 시 JSON 반환
        const data = await apiResponse.json(); 
        response.status(200).json(data);

    } catch (error) {
        // --- 여기가 중요합니다 ---
        // Vercel 로그에 자세한 에러 객체 전체를 출력합니다.
        console.error('Bareun API fetch error object:', error);
        
        // 프론트엔드(브라우저)에는 더 자세한 에러 원인을 보냅니다.
        response.status(500).json({ 
            error: "fetch failed", 
            message: error.message, // 예: "fetch failed"
            // error.cause는 네트워크 문제의 세부 원인을 알려줍니다.
            cause: error.cause ? String(error.cause) : 'No specific cause' 
        });
    }
}
