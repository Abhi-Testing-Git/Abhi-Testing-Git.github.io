import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Book, 
  Brain, 
  Plus, 
  Calendar, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Star,
  Edit,
  Trash2,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Progress } from './components/ui/progress';
import { Alert, AlertDescription } from './components/ui/alert';
import { toast } from 'sonner';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, recsRes] = await Promise.all([
        axios.get(`${API}/dashboard`),
        axios.get(`${API}/recommendations?limit=5`)
      ]);
      setStats(statsRes.data);
      setRecommendations(recsRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const markAsRevised = async (subtopicId, performance) => {
    try {
      await axios.post(`${API}/revisions`, {
        subtopic_id: subtopicId,
        performance: performance
      });
      toast.success('Revision marked successfully!');
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error marking revision:', error);
      toast.error('Failed to mark revision');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 RevisionPro Dashboard</h1>
          <p className="text-gray-600">AI-powered spaced repetition for smarter studying</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <Book className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{stats?.total_subjects || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Topics & Subtopics</CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{(stats?.total_topics || 0) + (stats?.total_subtopics || 0)}</div>
              <p className="text-xs text-gray-600 mt-1">{stats?.total_topics} topics, {stats?.total_subtopics} subtopics</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.overdue_count || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Need attention</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mastered</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats?.mastered_count || 0}</div>
              <p className="text-xs text-gray-600 mt-1">Well understood</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Smart suggestions based on your study patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={rec.subtopic_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {rec.subject_name} → {rec.topic_name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Priority: {rec.priority_score.toFixed(1)}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-900">{rec.subtopic_name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAsRevised(rec.subtopic_id, 'Struggled')}
                        >
                          Struggled
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => markAsRevised(rec.subtopic_id, 'Mastered')}
                        >
                          Mastered
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations yet. Add some subjects and topics to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Progress Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Mastered</span>
                  <span className="text-emerald-600 font-semibold">{stats?.mastered_count || 0}</span>
                </div>
                <Progress value={stats?.total_subtopics ? (stats.mastered_count / stats.total_subtopics) * 100 : 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Struggled</span>
                  <span className="text-orange-600 font-semibold">{stats?.struggled_count || 0}</span>
                </div>
                <Progress value={stats?.total_subtopics ? (stats.struggled_count / stats.total_subtopics) * 100 : 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">  
                  <span>Not Started</span>
                  <span className="text-gray-600 font-semibold">{stats?.not_started_count || 0}</span>
                </div>
                <Progress value={stats?.total_subtopics ? (stats.not_started_count / stats.total_subtopics) * 100 : 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Subject Management Component
const SubjectManager = () => {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadTopics(selectedSubject.id);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedTopic) {
      loadSubtopics(selectedTopic.id);
    }
  }, [selectedTopic]);

  const loadSubjects = async () => {
    try {
      const response = await axios.get(`${API}/subjects`);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async (subjectId) => {
    try {
      const response = await axios.get(`${API}/topics?subject_id=${subjectId}`);
      setTopics(response.data);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadSubtopics = async (topicId) => {
    try {
      const response = await axios.get(`${API}/subtopics?topic_id=${topicId}`);
      setSubtopics(response.data);
    } catch (error) {
      console.error('Error loading subtopics:', error);
    }
  };

  const createSubject = async (name, description = '') => {
    try {
      await axios.post(`${API}/subjects`, { name, description });
      toast.success('Subject created successfully!');
      loadSubjects();
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error('Failed to create subject');
    }
  };

  const createTopic = async (name, description = '') => {
    if (!selectedSubject) return;
    try {
      await axios.post(`${API}/topics`, { 
        subject_id: selectedSubject.id, 
        name, 
        description 
      });
      toast.success('Topic created successfully!');
      loadTopics(selectedSubject.id);
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('Failed to create topic');
    }
  };

  const createSubtopic = async (name, description = '', difficulty = 'Moderate') => {
    if (!selectedTopic) return;
    try {
      await axios.post(`${API}/subtopics`, { 
        topic_id: selectedTopic.id, 
        name, 
        description,
        difficulty 
      });
      toast.success('Subtopic created successfully!');
      loadSubtopics(selectedTopic.id);
    } catch (error) {
      console.error('Error creating subtopic:', error);
      toast.error('Failed to create subtopic');
    }
  };

  const deleteSubject = async (id) => {
    try {
      await axios.delete(`${API}/subjects/${id}`);
      toast.success('Subject deleted successfully!');
      loadSubjects();
      setSelectedSubject(null);
      setTopics([]);
      setSubtopics([]);
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  const deleteTopic = async (id) => {
    try {
      await axios.delete(`${API}/topics/${id}`);
      toast.success('Topic deleted successfully!');
      if (selectedSubject) loadTopics(selectedSubject.id);
      setSelectedTopic(null);
      setSubtopics([]);
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Failed to delete topic');
    }
  };

  const deleteSubtopic = async (id) => {
    try {
      await axios.delete(`${API}/subtopics/${id}`);
      toast.success('Subtopic deleted successfully!');
      if (selectedTopic) loadSubtopics(selectedTopic.id);
    } catch (error) {
      console.error('Error deleting subtopic:', error);
      toast.error('Failed to delete subtopic');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>  
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📝 Manage Subjects</h1>
          <p className="text-gray-600">Organize your study materials hierarchically</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">  
          {/* Subjects Panel */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-indigo-600" />
                Subjects
              </CardTitle>
              <AddSubjectDialog onCreate={createSubject} />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSubject?.id === subject.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-25'
                    }`}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubject(subject.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    {subject.description && (
                      <p className="text-sm text-gray-600 mt-1">{subject.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Topics Panel */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Topics
              </CardTitle>
              {selectedSubject && <AddTopicDialog onCreate={createTopic} />}
            </CardHeader>
            <CardContent>
              {selectedSubject ? (
                <div className="space-y-2">
                  {topics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTopic?.id === topic.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                      }`}
                      onClick={() => setSelectedTopic(topic)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{topic.name}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTopic(topic.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      {topic.description && (
                        <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Select a subject to view topics</p>
              )}
            </CardContent>
          </Card>

          {/* Subtopics Panel */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Subtopics
              </CardTitle>
              {selectedTopic && <AddSubtopicDialog onCreate={createSubtopic} />}
            </CardHeader>
            <CardContent>
              {selectedTopic ? (
                <div className="space-y-2">
                  {subtopics.map((subtopic) => (
                    <div key={subtopic.id} className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">{subtopic.name}</h5>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSubtopic(subtopic.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <Badge 
                          variant={subtopic.difficulty === 'Hard' ? 'destructive' : 
                                   subtopic.difficulty === 'Moderate' ? 'default' : 'secondary'}
                        >
                          {subtopic.difficulty}
                        </Badge>
                        <Badge 
                          variant={subtopic.performance_status === 'Mastered' ? 'default' : 
                                   subtopic.performance_status === 'Struggled' ? 'destructive' : 'outline'}
                        >
                          {subtopic.performance_status}
                        </Badge>
                      </div>
                      {subtopic.description && (
                        <p className="text-sm text-gray-600 mb-2">{subtopic.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        {subtopic.last_revised ? 
                          `Last revised: ${new Date(subtopic.last_revised).toLocaleDateString()}` :
                          'Never revised'
                        }
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Select a topic to view subtopics</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Dialog Components
const AddSubjectDialog = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
      setOpen(false);
      setName('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>Create a new subject to organize your study materials</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Subject name (e.g., Physics, Mathematics)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit" className="w-full">Create Subject</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AddTopicDialog = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
      setOpen(false);
      setName('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Topic</DialogTitle>
          <DialogDescription>Create a new topic under the selected subject</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Topic name (e.g., Mechanics, Thermodynamics)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit" className="w-full">Create Topic</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AddSubtopicDialog = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Moderate');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim(), difficulty);
      setOpen(false);
      setName('');
      setDescription('');
      setDifficulty('Moderate');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Subtopic</DialogTitle>
          <DialogDescription>Create a new subtopic under the selected topic</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Subtopic name (e.g., Newton's Laws, Work & Energy)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="w-full">Create Subtopic</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Navigation Component
const Navigation = () => {
  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
              <Brain className="h-8 w-8" />
              RevisionPro
            </Link>
            <div className="flex gap-6">
              <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
              <Link to="/subjects" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors">
                <Book className="h-4 w-4" />
                Subjects
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subjects" element={<SubjectManager />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;