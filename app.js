const express = require('express')
const bodyparer = require('body-parser')
const session = require('express-session')
const fs = require('fs')
const ejs = require('ejs')
const fetch = require('node-fetch');
const app = express()
const port = 3000


app.use(bodyparer.urlencoded({extended: false}))
app.use(express.static(__dirname+'/public'))
app.set('view engine', 'ejs')
app.set('views', './views')

app.use(session({secret:'capstone', cookie:{ maxAge: 60000}, resave:true, saveUninitialized:true,}))
app.use((req, res, next) => {

  res.locals.id="";
  res.locals.pw="";
  res.locals.Email="";
  res.locals.name="";
  res.locals.Birth="";
  
  if(req.session.user){

  res.locals.id = req.session.user.id
  res.locals.pw = req.session.user.pw
  res.locals.Email = req.session.user.Email
  res.locals.name = req.session.user.name
  res.locals.Birth = req.session.user.Birth
  
  }

  next()
})

app.use(express.static('img'));

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'LSH7136!!',
  database: 'capstone'
});

connection.connect((e) =>{
  if(e) throw e;
  console.log('성공')
});

app.get('/', (req, res) => {
  const certiQuery = 'SELECT * FROM certis ORDER BY RAND() LIMIT 4';
  const contestQuery = 'SELECT * FROM contests ORDER BY RAND() LIMIT 4';

  connection.query(certiQuery, (err, certiResults) => {
    if (err) {
      console.error('Error fetching certifications:', err);
      res.status(500).send('Error fetching certifications');
      return;
    }

    connection.query(contestQuery, (err, contestResults) => {
      if (err) {
        console.error('Error fetching contests:', err);
        res.status(500).send('Error fetching contests');
        return;
      }

      const contestsWithImages = contestResults.map(contest => {
        const imageBuffer = contest.Cimg;
        const imageBase64 = imageBuffer.toString('base64');
        return {
          ...contest,
          Cimg: `data:image/jpeg;base64,${imageBase64}`
        };
      });

      res.render('Main', {
        certifications: certiResults,
        contests: contestsWithImages
      });
    });
  });
});

app.get('/Main', (req, res) => {
  const certiQuery = 'SELECT * FROM certis ORDER BY RAND() LIMIT 3';
  const contestQuery = 'SELECT * FROM contests ORDER BY RAND() LIMIT 3';

  connection.query(certiQuery, (err, certiResults) => {
    if (err) {
      console.error('Error fetching certifications:', err);
      res.status(500).send('Error fetching certifications');
      return;
    }

    connection.query(contestQuery, (err, contestResults) => {
      if (err) {
        console.error('Error fetching contests:', err);
        res.status(500).send('Error fetching contests');
        return;
      }

      const contestsWithImages = contestResults.map(contest => {
        const imageBuffer = contest.Cimg;
        const imageBase64 = imageBuffer.toString('base64');
        return {
          ...contest,
          Cimg: `data:image/jpeg;base64,${imageBase64}`
        };
      });

      res.render('Main', {
        certifications: certiResults,
        contests: contestsWithImages
      });
    });
  });
})

app.get('/Login', (req, res) => {
  res.render('Login')
})

app.get('/Mypage', (req, res) => {
  res.render('Mypage')
})

app.get('/Mypagechange', (req, res) => {
  res.render('Mypagechange')
})

app.get('/Signup', (req, res) => {
  res.render('Signup')
})

app.get('/Job', (req, res) => {
  res.render('Job')
})

app.get('/JobinfoP', (req, res) => {
  const sn = req.query.sn;
  const apiUrl = `https://apis.data.go.kr/1051000/recruitment/detail?serviceKey=k37HWktPjA3anJe%2FxNyy3%2Fo9Q8KSCrfdRqnwIri1WdLi%2BJNuK6t6mSeeLu0TMZKU1KA%2FdIKLqYDYlqGxp0fFTQ%3D%3D&resultType=json&sn=${sn}`;
  
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const result = data.result;
      res.render('JobinfoP', { result }); // 수정된 부분
    })
    .catch(error => {
      console.error('Error loading the data:', error);
      res.status(500).send('Error loading the data');
    });
});

app.get('/Contest', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const itemsPerPage = 8;
  const offset = (page - 1) * itemsPerPage;

  const countQuery = 'SELECT COUNT(*) AS count FROM contests';
  connection.query(countQuery, (err, countResults) => {
    if (err) {
      console.error('데이터베이스 쿼리 오류:', err);
      res.status(500).send('데이터베이스 쿼리 오류');
      return;
    }

    const totalItems = countResults[0].count;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const mysql = 'SELECT * FROM contests ORDER BY Cn LIMIT ? OFFSET ?';
    connection.query(mysql, [itemsPerPage, offset], (err, results) => {
      if (err) {
        console.error('데이터베이스 쿼리 오류:', err);
        res.status(500).send('데이터베이스 쿼리 오류');
        return;
      }

      const contestsWithImages = results.map(contest => {
        const imageBuffer = contest.Cimg;
        const imageBase64 = imageBuffer.toString('base64');
        return {
          ...contest,
          Cimg: `data:image/jpeg;base64,${imageBase64}`
        };
      });

      res.render('Contest', {
        results: contestsWithImages,
        currentPage: page,
        totalPages: totalPages
      });
    });
  });
});

app.get('/Certi', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const itemsPerPage = 12;
  const offset = (page - 1) * itemsPerPage;

  const countQuery = 'SELECT COUNT(*) AS count FROM certis';
  connection.query(countQuery, (err, countResults) => {
    if (err) {
      console.error('데이터베이스 쿼리 오류:', err);
      res.status(500).send('데이터베이스 쿼리 오류');
      return;
    }

    const totalItems = countResults[0].count;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const dataQuery = 'SELECT * FROM certis ORDER BY Cname LIMIT ? OFFSET ?';
    connection.query(dataQuery, [itemsPerPage, offset], (err, results) => {
      if (err) {
        console.error('데이터베이스 쿼리 오류:', err);
        res.status(500).send('데이터베이스 쿼리 오류');
        return;
      }

      res.render('Certi', {
        results: results,
        currentPage: page,
        totalPages: totalPages
      });
    });
  });
});


app.get('/Cinfo', (req, res) => {
  res.render('Cinfo')
})

app.get('/Exhibition', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const itemsPerPage = 8;
  const offset = (page - 1) * itemsPerPage;

  const countQuery = 'SELECT COUNT(*) AS count FROM exhibitions';
  connection.query(countQuery, (err, countResults) => {
    if (err) {
      console.error('데이터베이스 쿼리 오류:', err);
      res.status(500).send('데이터베이스 쿼리 오류');
      return;
    }

    const totalItems = countResults[0].count;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const dataQuery = 'SELECT * FROM exhibitions ORDER BY En LIMIT ? OFFSET ?';
    connection.query(dataQuery, [itemsPerPage, offset], (err, results) => {
      if (err) {
        console.error('데이터베이스 쿼리 오류:', err);
        res.status(500).send('데이터베이스 쿼리 오류');
        return;
      }

      const exhibitionsWithImages = results.map(exhibition => {
        const imageBuffer = exhibition.Eimg;
        const imageBase64 = imageBuffer.toString('base64');
        return {
          ...exhibition,
          Eimg: `data:image/jpeg;base64,${imageBase64}`
        };
      });

      res.render('Exhibition', {
        results: exhibitionsWithImages,
        currentPage: page,
        totalPages: totalPages
      });
    });
  });
});

app.get('/CareerBuddy', (req, res) => {
  res.render('CareerBuddy')
})

// 이미지
app.get('/img', (req, res) => {
  readFile('공모전 1.jpg', (err, data) => {
    if(err) { res.send() }
    res.send(data)
  })
})

// 회원가입
app.post('/signupProc', (req, res) => {
  const id = req.body.id;
  const pw = req.body.pw;
  const Email = req.body.Email;
  const name = req.body.name;
  const Birth = req.body.Birth;
  
  var mysql = "INSERT INTO user (id, pw, Email, name, Birth) VALUES(?, ?, ?, ?, ?)"
  var params = [id, pw, Email, name, Birth];

  connection.query(mysql, params, function(err, result){
    if(err) throw err;

    if(result.length>0){
      console.log(result)
      res.send("<script> alert('존재하는 아이디입니다.'); location.href='/Signup';</script>");
    }else{
    console.log('회원가입 성공');
    res.send("<script> alert('회원가입 성공'); location.href='/';</script>");
    }
  })

})


// 로그인
app.post('/loginProc', (req, res) => {

  const id = req.body.id;
  const pw = req.body.pw;

  var mysql = 'SELECT * FROM user WHERE id=? AND pw=?'
  var params = [id, pw];

  connection.query(mysql, params, function(err, result){
    if(err) throw err;

    if(result.length==0){
      console.log(result)
      res.send("<script> alert('존재하지 않는 아이디입니다.'); location.href='/Login';</script>");
    }else{
      console.log(result[0])
      req.session.user = result[0]
      res.send("<script> alert('로그인 되었습니다.'); location.href='/';</script>");

    }
  })

})

// 로그아웃
app.get('/Logout', (req, res) => {
  
  req.session.user = null;
  res.send("<script> alert('로그아웃 되었습니다.'); location.href='/';</script>");

})

// 회원정보 삭제
app.get('/deleteUser', (req, res) => {
  // 세션에서 로그인된 사용자 정보 가져오기
  const user = req.session.user;

  // 사용자 ID 가져오기
  const id = user.id;

  // 데이터베이스에서 계정 삭제하는 쿼리
  const mysql = `DELETE FROM user WHERE id = '${id}'`;

  // 데이터베이스 쿼리 실행
  connection.query(mysql, (err, result) => {
      if (err) {
          // 오류가 발생한 경우 오류 메시지 출력
          console.error('계정 삭제 중 오류 발생:', err);
          res.status(500).send('서버 오류 발생. 다시 시도해주세요.');
          return;
      }

      // 삭제 성공 시 세션에서 계정 제거
      delete req.session.user;

      // 삭제 완료 메시지 출력
      console.log('계정이 삭제되었습니다.');
      res.send("<script> alert('계정이 삭제되었습니다.'); location.href='/';</script>");
      
  });
});


// 회원정보 수정
app.post('/updateProfile', (req, res) => {
  const id = req.session.user.id; // 세션에서 현재 로그인한 사용자의 아이디를 가져옵니다.
  const pw = req.body.pw;
  const Email = req.body.Email;
  const name = req.body.name;
  const Birth = req.body.Birth;
  
  // 사용자가 입력한 정보를 데이터베이스에 업데이트합니다.
  var mysql = "UPDATE user SET pw=?, Email=?, name=?, Birth=? WHERE id=?";
  var params = [pw, Email, name, Birth, id];

  connection.query(mysql, params, function(err, result){
    if(err) throw err;

    console.log('회원정보 수정 완료');
    // 수정이 완료되면 성공 메시지를 표시하고 메인 페이지로 리다이렉트합니다.
    res.send("<script> alert('회원정보가 수정되었습니다.'); location.href='/Main';</script>");
  });
});


// 검색창 기능
app.get('/search', (req, res) => {
  const query = req.query.query; // 검색어

  // 자격증 정보를 검색하는 SQL 쿼리
  const certiSql = `SELECT * FROM certis WHERE Cname LIKE '%${query}%'`;

  // 공모전 정보를 검색하는 SQL 쿼리
  const contestSql = `SELECT * FROM contests WHERE Cn LIKE '%${query}%'`;

  // 대외활동 정보를 검색하는 SQL 쿼리
  const exhibitionSql = `SELECT * FROM exhibitions WHERE En LIKE '%${query}%'`;

  // 데이터베이스에서 자격증 쿼리 실행
  connection.query(certiSql, (err, certiResults) => {
      if (err) {
          console.error('Error searching certifications:', err);
          res.status(500).send('Error searching certifications');
          return;
      }

      // 데이터베이스에서 공모전 쿼리 실행
      connection.query(contestSql, (err, contestResults) => {
          if (err) {
              console.error('Error searching contests:', err);
              res.status(500).send('Error searching contests');
              return;
          }

      // 데이터베이스에서 대외활동 쿼리 실행
          connection.query(exhibitionSql, (err, exhibitionResults) => {
            if (err) {
                console.error('Error searching exhibitions:', err);
                res.status(500).send('Error searching exhibitions');
                return;
            }

          // 검색 결과를 렌더링
          res.render('SearchResults', { certiResults: certiResults, contestResults: contestResults, exhibitionResults: exhibitionResults });
      });
  });
});
});

// 조건 검색창
app.get('/Searchs', (req, res) => {
  res.render('Searchs');

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});