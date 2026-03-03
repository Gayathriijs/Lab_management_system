"""
Quiz generation service.
Handles AI-based quiz question generation (placeholder implementation).
"""

from app.models import Database
import random


class QuizService:
    """Service for generating and managing quizzes"""
    
    @staticmethod
    def generate_quiz(experiment_id, title, num_questions=5, duration_minutes=30, created_by=None):
        """
        Generate AI-based quiz questions for an experiment.
        
        NOTE: This is a PLACEHOLDER implementation with sample questions.
        In production, you would integrate with an AI service like:
        - OpenAI GPT-4 API
        - Google Gemini API
        - Anthropic Claude API
        
        Args:
            experiment_id (int): Experiment ID
            title (str): Quiz title
            num_questions (int): Number of questions to generate
            duration_minutes (int): Quiz duration
            created_by (int): Teacher ID
            
        Returns:
            dict: Quiz data with questions
        """
        try:
            # Get experiment details
            exp_query = """
                SELECT title, description 
                FROM experiments 
                WHERE id = %s
            """
            experiment = Database.execute_query(
                exp_query,
                (experiment_id,),
                fetch_one=True
            )
            
            if not experiment:
                raise ValueError("Experiment not found")
            
            # Calculate total marks (2 marks per question)
            total_marks = num_questions * 2.0
            
            # Create quiz
            quiz_query = """
                INSERT INTO quizzes 
                (experiment_id, title, duration_minutes, total_marks, created_by, is_active)
                VALUES (%s, %s, %s, %s, %s, FALSE)
            """
            quiz_id = Database.execute_query(
                quiz_query,
                (experiment_id, title, duration_minutes, total_marks, created_by),
                commit=True
            )
            
            # Generate questions (PLACEHOLDER - replace with AI integration)
            questions = QuizService._generate_sample_questions(
                experiment['title'],
                experiment['description'],
                num_questions
            )
            
            # Insert questions into database
            question_ids = []
            for question in questions:
                question_query = """
                    INSERT INTO quiz_questions
                    (quiz_id, question_text, option_a, option_b, option_c, option_d, 
                     correct_answer, marks)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                q_id = Database.execute_query(
                    question_query,
                    (
                        quiz_id,
                        question['question_text'],
                        question['option_a'],
                        question['option_b'],
                        question['option_c'],
                        question['option_d'],
                        question['correct_answer'],
                        question['marks']
                    ),
                    commit=True
                )
                question_ids.append(q_id)
            
            return {
                'message': 'Quiz generated successfully',
                'quiz_id': quiz_id,
                'total_questions': num_questions,
                'total_marks': total_marks,
                'questions': questions
            }
            
        except Exception as e:
            print(f"Error generating quiz: {e}")
            raise
    
    @staticmethod
    def _generate_sample_questions(experiment_title, description, num_questions):
        """
        Generate sample quiz questions (PLACEHOLDER).
        
        TODO: Replace with AI integration
        - Parse experiment documentation
        - Extract key concepts
        - Generate contextual questions
        - Ensure difficulty distribution
        
        Example AI Integration:
```python
        import openai
        
        prompt = f'''
        Generate {num_questions} multiple choice questions for a lab experiment:
        Title: {experiment_title}
        Description: {description}
        
        Format each question as:
        Question: [question text]
        A) [option]
        B) [option]
        C) [option]
        D) [option]
        Correct: [A/B/C/D]
        '''
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse response and return structured questions
```
        
        Args:
            experiment_title (str): Experiment title
            description (str): Experiment description
            num_questions (int): Number of questions
            
        Returns:
            list: List of question dictionaries
        """
        
        # Sample question templates based on common CS topics
        question_templates = [
            {
                'topic': 'data_structures',
                'questions': [
                    {
                        'question_text': f'What is the time complexity of searching in {experiment_title}?',
                        'option_a': 'O(1)',
                        'option_b': 'O(log n)',
                        'option_c': 'O(n)',
                        'option_d': 'O(n²)',
                        'correct_answer': 'b',
                        'marks': 2.0
                    },
                    {
                        'question_text': f'Which traversal method is most efficient for {experiment_title}?',
                        'option_a': 'Inorder',
                        'option_b': 'Preorder',
                        'option_c': 'Postorder',
                        'option_d': 'Level-order',
                        'correct_answer': 'a',
                        'marks': 2.0
                    },
                    {
                        'question_text': f'What is the space complexity of {experiment_title}?',
                        'option_a': 'O(1)',
                        'option_b': 'O(log n)',
                        'option_c': 'O(n)',
                        'option_d': 'O(n²)',
                        'correct_answer': 'c',
                        'marks': 2.0
                    },
                    {
                        'question_text': f'Which property must be maintained in {experiment_title}?',
                        'option_a': 'FIFO order',
                        'option_b': 'LIFO order',
                        'option_c': 'Sorted order',
                        'option_d': 'Random order',
                        'correct_answer': 'c',
                        'marks': 2.0
                    },
                    {
                        'question_text': f'What is the worst-case scenario for {experiment_title}?',
                        'option_a': 'All elements equal',
                        'option_b': 'Already sorted',
                        'option_c': 'Reverse sorted',
                        'option_d': 'Random order',
                        'correct_answer': 'c',
                        'marks': 2.0
                    }
                ]
            },
            {
                'topic': 'algorithms',
                'questions': [
                    {
                        'question_text': f'What paradigm does {experiment_title} follow?',
                        'option_a': 'Divide and Conquer',
                        'option_b': 'Dynamic Programming',
                        'option_c': 'Greedy',
                        'option_d': 'Backtracking',
                        'correct_answer': 'a',
                        'marks': 2.0
                    },
                    {
                        'question_text': f'What is the primary advantage of {experiment_title}?',
                        'option_a': 'Low memory usage',
                        'option_b': 'Fast execution',
                        'option_c': 'Easy implementation',
                        'option_d': 'Guaranteed optimal solution',
                        'correct_answer': 'b',
                        'marks': 2.0
                    },
                    {
                        'question_text': f'Which data structure is commonly used in {experiment_title}?',
                        'option_a': 'Array',
                        'option_b': 'Linked List',
                        'option_c': 'Stack',
                        'option_d': 'Queue',
                        'correct_answer': 'a',
                        'marks': 2.0
                    }
                ]
            }
        ]
        
        # Randomly select questions
        all_questions = []
        for template in question_templates:
            all_questions.extend(template['questions'])
        
        # Shuffle and select required number
        random.shuffle(all_questions)
        selected_questions = all_questions[:num_questions]
        
        return selected_questions
    
    @staticmethod
    def get_quiz_questions(quiz_id, include_answers=False):
        """
        Get questions for a quiz.
        
        Args:
            quiz_id (int): Quiz ID
            include_answers (bool): Include correct answers (for teachers)
            
        Returns:
            list: Quiz questions
        """
        try:
            if include_answers:
                query = """
                    SELECT id, question_text, option_a, option_b, option_c, 
                           option_d, correct_answer, marks
                    FROM quiz_questions
                    WHERE quiz_id = %s
                """
            else:
                query = """
                    SELECT id, question_text, option_a, option_b, option_c, 
                           option_d, marks
                    FROM quiz_questions
                    WHERE quiz_id = %s
                """
            
            questions = Database.execute_query(query, (quiz_id,), fetch_all=True)
            
            return questions
            
        except Exception as e:
            print(f"Error fetching quiz questions: {e}")
            raise
    
    @staticmethod
    def evaluate_quiz_attempt(attempt_id):
        """
        Evaluate a quiz attempt and calculate score.
        
        Args:
            attempt_id (int): Quiz attempt ID
            
        Returns:
            dict: Evaluation results
        """
        try:
            # Get quiz attempt
            attempt_query = """
                SELECT quiz_id, student_id
                FROM quiz_attempts
                WHERE id = %s
            """
            attempt = Database.execute_query(
                attempt_query,
                (attempt_id,),
                fetch_one=True
            )
            
            if not attempt:
                raise ValueError("Attempt not found")
            
            # Get answers with correct answer comparison
            answers_query = """
                SELECT 
                    qa.question_id,
                    qa.selected_answer,
                    qq.correct_answer,
                    qq.marks,
                    qa.selected_answer = qq.correct_answer as is_correct
                FROM quiz_answers qa
                INNER JOIN quiz_questions qq ON qa.question_id = qq.id
                WHERE qa.attempt_id = %s
            """
            answers = Database.execute_query(
                answers_query,
                (attempt_id,),
                fetch_all=True
            )
            
            # Calculate score
            total_score = 0.0
            correct_count = 0
            
            for answer in answers:
                if answer['is_correct']:
                    total_score += float(answer['marks'])
                    correct_count += 1
            
            total_questions = len(answers)
            percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
            
            return {
                'total_score': total_score,
                'correct_answers': correct_count,
                'total_questions': total_questions,
                'percentage': round(percentage, 2)
            }
            
        except Exception as e:
            print(f"Error evaluating quiz: {e}")
            raise
    
    @staticmethod
    def integrate_with_ai(experiment_data):
        """
        PLACEHOLDER: Integration point for AI services.
        
        To integrate with OpenAI GPT-4:
        1. Install: pip install openai
        2. Set API key: export OPENAI_API_KEY='your-key'
        3. Use the code below:
```python
        import openai
        import json
        
        def generate_ai_questions(experiment_title, description, num_questions):
            prompt = f'''
            You are an expert computer science educator. Generate {num_questions} 
            multiple-choice questions for a lab experiment.
            
            Experiment: {experiment_title}
            Description: {description}
            
            Requirements:
            - Questions should test understanding, not just recall
            - Include a mix of conceptual and practical questions
            - Ensure one clearly correct answer per question
            
            Return ONLY a JSON array with this structure:
            [
                {{
                    "question_text": "...",
                    "option_a": "...",
                    "option_b": "...",
                    "option_c": "...",
                    "option_d": "...",
                    "correct_answer": "a/b/c/d",
                    "marks": 2.0
                }}
            ]
            '''
            
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a helpful CS educator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            questions_json = response.choices[0].message.content
            questions = json.loads(questions_json)
            
            return questions
```
        
        Args:
            experiment_data (dict): Experiment information
            
        Returns:
            list: AI-generated questions
        """
        
        # This is where you would call your AI service
        # For now, return None to use sample questions
        return None