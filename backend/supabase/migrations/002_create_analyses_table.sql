-- Create analyses table for storing cricket analysis results
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    speed VARCHAR(255) NOT NULL,
    trajectory JSONB NOT NULL,
    detections JSONB NOT NULL,
    processing_time FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);

-- Enable Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for analysis access
CREATE POLICY "Users can view own analyses" ON analyses 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON analyses 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON analyses 
    FOR DELETE 
    USING (auth.uid() = user_id);
