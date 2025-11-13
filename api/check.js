// /api/check.js
// Vercel이 이 파일을 자동으로 Node.js 서버 함수로 만듭니다.

export default async function handler(request, response) {
    // 1. 프론트엔드에서 보낸 텍스트 받기 (POST 방식)
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }
    const { text } = request.body;
    if (!text) {
        return response.status(400).json({ error: 'No text provided' });
    }

    // 2. 부산대학교 맞춤법 검사기 API로 요청 보내기
    // 이 API는 텍스트를 form-data 형식으로 받습니다.
    const params = new URLSearchParams();
    params.append('text1', text);

    try {
        const apiResponse = await fetch('http://speller.cs.pusan.ac.kr/results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
            // 이 API는 응답에 쿠키를 포함하려고 해서, 리다이렉트를 수동으로 처리해야 함
            redirect: 'manual' 
        });

        // 리다이렉션 URL을 찾아서 다시 fetch (이 API의 독특한 작동 방식)
        const location = apiResponse.headers.get('location');
        if (!location && apiResponse.status !== 200) {
             throw new Error(`API server responded with ${apiResponse.status}`);
        }

        const resultResponse = await fetch(`http://speller.cs.pusan.ac.kr${location}`);
        const htmlResult = await resultResponse.text();

        // 3. API가 HTML을 반환하면, 그 안의 JSON 데이터만 추출
        const jsonStringMatch = htmlResult.match(/data\s*=\s*(\[.+\]);/s);
        
        if (jsonStringMatch && jsonStringMatch[1]) {
            // "data = [...]" 에서 [...] 부분만 추출
            const cleanJsonString = jsonStringMatch[1];
            
            // 4. JSON 데이터를 프론트엔드로 다시 보냄
            // Vercel에서 JSON으로 변환하면 한글이 깨질 수 있으므로, 텍스트 그대로 보냄
            response.status(200).setHeader('Content-Type', 'application/json').send(cleanJsonString);
        } else {
            // 오류가 없는 경우, 빈 배열을 반환
            response.status(200).json([]);
        }

    } catch (error) {
        console.error('Serverless function error:', error);
        response.status(500).json({ error: error.message });
    }
}
