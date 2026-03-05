ALTER TABLE discoveries 
ADD CONSTRAINT discoveries_user_id_song_id_key UNIQUE (user_id, song_id);