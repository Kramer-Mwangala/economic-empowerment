const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('c0b186ae4eee445a876f4dea6cb0d2b1');
const app = express();
const port = 3001;
const secretKey = 'KALPANA';
const { Configuration, OpenAIApi } = require("openai");
const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/WIT'; 

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: String
});

const postSchema = new mongoose.Schema({
  text: { type: String, required: true },
  datePosted: { type: Date, default: Date.now },
  opUsername: String
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());



// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// News routes
app.get('/news', (req, res) => {
  newsapi.v2.everything({
    q: 'financial+literacy+women+Africa',
    language: 'en'
   
  })
  .then(response => {
    const articles = response.articles.map(article => {
      return {
        title: article.title,
        author: article.author,
        description: article.description,
        url: article.url
      };
    });
    res.json(articles);
  })
  .catch(error => {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  });
});

app.get('/schemes', (req, res) => {
 /* newsapi.v2.everything({
    q: 'women+schemes',
    language: 'en'
  })*/
    newsapi.v2.everything({
        q: 'economic+empowerment+kenya',
        
        language: 'en',
       
      })
  .then(response => {
    const articles = response.articles.map(article => {
      return {
        title: article.title,
        author: article.author,
        description: article.description,
        url: article.url
      };
    });
    res.json(articles);
  })
  .catch(error => {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  });
});

// Post routes
app.post('/post', async (req, res) => {
  const { text, datePosted, opUsername } = req.body;

  try {
    const newPost = new Post({ text, datePosted, opUsername });
    await newPost.save();
    res.json({ message: 'Post created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/posts',  async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/posts',  async (req, res) => {
  const postId = req.params.id;

  try {
    const deletedPost = await Post.findByIdAndDelete(postId);
    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Authentication routes
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !user.validatePassword(password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/signup', async (req, res) => {
  const { username, password, location } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = new User({ username, password, location });
    await newUser.save();

 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Chatbot route
app.post('/chat', async (req, res) => {
  let content = "These are sample conversations which u need to take as your context. Dont use these in your answers. use this as a reference. Answer accordingly.";
  content += `{
    "Question": "What is the difference between simple interest and compound interest, as explained in the text? How do these interest types affect the growth of savings?",
    "Answer": "Simple interest is earned only on the principal amount, while compound interest is earned on both the principal and previously earned interest. Compound interest leads to exponential growth of savings over time, whereas simple interest does not account for the reinvestment of earned interest."
  }`;

  content += `{
    "Question": "How does inflation impact investments, as discussed in the text? Why is it important for investors to consider inflation during financial planning?",
    "Answer": "Inflation reduces the value of money over time, decreasing the purchasing power of savings and investments. It is crucial for investors to consider inflation during financial planning to ensure that their investments maintain or exceed the rate of inflation, preserving their real value."
  }, {
    "Question": "What is the of savings and investment according to the text.",
    "Answer": "Savings are the surplus of income over expenditure, while investment involves deploying money from savings into financial or non-financial products with the expectation of earning higher returns over time."
  }, {
    "Question": "What is the Stand-Up India Scheme outlined in the text. How does it support women entrepreneurs, and what are its objectives?",
    "Answer": "The Stand-Up India Scheme promotes entrepreneurship among women and marginalized communities by providing bank loans for the establishment of greenfield businesses. It ensures that at least one woman per bank branch receives financial support to start or expand her small business, thereby empowering women to become entrepreneurs."
  }`;

  const Uinput = req.body.message;

  const keywords = [
    'women',
    'financial literacy',
    'financial education',
    'budgeting',
    'saving',
    'investing',
    'retirement planning',
    'debt management',
    'financial independence',
    'wage gap',
    'taxes',
    'tax',
    'bank',
    'loans',
    'schemes',
    'girls',
    'school',
    'gender equality in finance',
    'economic empowerment',
    'financial inclusion',
    'financial decision-making',
    'financial awareness',
    'money management',
    'financial security',
    'entrepreneurship opportunities for women'
];
const containsKeyword = keywords.some(keyword => Uinput.includes(keyword));
if(!containsKeyword){
    return res.json({answer: "Out of syllabus"})
}
content += Uinput;
// few shot approach

    // console.log(content);
const configuration = new Configuration({
// apiKey: process.env.OPENAI_API_KEY,
apiKey: 'API-KEY',
});
const openai = new OpenAIApi(configuration);

const chatCompletion = await openai.createChatCompletion({
model: "gpt-3.5-turbo",
messages: [{role: "user", content: JSON.stringify(content)}],

});

console.log(chatCompletion.data.choices[0].message.content);
answer = chatCompletion.data.choices[0].message.content;
res.json({answer: answer});
})



app.listen(port, () => {
console.log(`Example app listening on port ${port}`)
})