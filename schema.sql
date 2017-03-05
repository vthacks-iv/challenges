CREATE TABLE records (
    uuid            uuid NOT NULL,
    datetime        timestamp WITH TIME ZONE NOT NULL,
    level           smallint NOT NULL,
    submission      text NOT NULL,
    correct         boolean NOT NULL
);
