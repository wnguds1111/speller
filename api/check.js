// /api/check.js
// [최종] Bareun API (bareun.ai)를 호출하는 버전

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // 1. Vercel 환경 변수에서 API 키 가져오기
    const apiKey = process.env.BAREUN_API_KEY;
    if (!apiKey) {
        console.error('API Key is missing');
        return response.status(500).json({ error: 'Server configuration error' });
    }

    // 2. 프론트엔드에서 보낸 텍스트 받기
    const { text } = request.body;
    if (!text || text.trim() === "") {
        // 텍스트가 없으면 빈 JSON 객체 반환
        return response.status(200).json({}); 
    }

    // 3. '바른 API' 공식 엔드포인트 및 요청 데이터
    const apiUrl = 'https://api.bareun.ai/bareun/api/v1/correct-error';
    
    // '바른 API'는 이 JSON 형식으로 요청해야 합니다.
    const apiRequestBody = {
        document: {
            content: text,
            language: "ko-KR"
        }
    };

    try {
        // 4. '바른 API'에 검사 요청 (POST)
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey // 헤더에 API 키 포함
            },
            body: JSON.stringify(apiRequestBody)
        });

        if (!apiResponse.ok) {
            // 401 (키 틀림), 403 (권한 없음), 500 (바른 API 서버 에러)
            const errorText = await apiResponse.text();
            console.error(`Bareun API error: ${apiResponse.status}`, errorText);
            throw new Error(`Bareun API responded with ${apiResponse.status}`);
        }

        // 5. 성공 시, JSON 응답을 그대로 프론트엔드로 전달
        const data = await apiResponse.json(); 
        response.status(200).json(data);

    } catch (error) {
        console.error('Bareun API fetch error:', error.message);
        response.status(500).json({ error: error.message });
    }
}
