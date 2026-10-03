import re


SECTION_KEYWORDS = {
    "summary": [
        "summary",
        "profile",
        "objective",
        "about me",
    ],
    "experience": [
        "experience",
        "employment",
        "work experience",
        "professional experience",
        "career",
        "internship",
        "internships",
    ],
    "projects": [
        "projects",
        "academic projects",
        "personal projects",
        "key projects",
    ],
    "skills": [
        "skills",
        "technical skills",
        "technical expertise",
        "programming",
        "frameworks",
        "tools",
        "technologies",
    ],
    "education": [
        "education",
        "academic background",
        "qualifications",
    ],
    "certifications": [
        "certification",
        "certifications",
        "courses",
        "training",
    ],
    "achievements": [
        "achievement",
        "achievements",
        "awards",
        "honors",
    ],
    "research": [
        "research",
        "publications",
    ],
    "volunteering": [
        "volunteer",
        "volunteering",
        "community",
    ],
}


ENTRY_SIGNALS = [
    "intern",
    "developer",
    "engineer",
    "lecturer",
    "professor",
    "analyst",
    "scientist",
    "manager",
    "consultant",
    "assistant",
    "administrator",
]


def clean_text(text: str) -> str:
    """
    Basic text cleanup.

    Removes excessive whitespace while preserving
    useful line boundaries.
    """

    lines = []

    for line in text.splitlines():

        line = line.strip()

        if line:
            lines.append(line)

    return "\n".join(lines)


def normalize_line(line: str) -> str:
    """
    Normalize a line for comparison.

    The original line is not modified.
    """

    line = line.strip().lower()

    line = re.sub(r"\s+", " ", line)

    return line


def looks_like_heading(line: str) -> bool:
    """
    Detect probable resume section headings.
    """

    line = line.strip()

    if not line:
        return False

    if len(line) > 60:
        return False

    if len(line.split()) > 6:
        return False

    if line.endswith((".", "!", "?")):
        return False

    normalized = normalize_line(line)

    if "@" in line or "http" in normalized:
        return False

    # Strong signal: ALL CAPS
    if line.upper() == line and any(
        char.isalpha() for char in line
    ):
        return True

    # Keyword signal
    for keywords in SECTION_KEYWORDS.values():

        for keyword in keywords:

            if normalized == keyword:
                return True

    return False


def canonical_section_type(heading: str) -> str:
    """
    Convert a detected heading into a normalized
    section type.
    """

    normalized = normalize_line(heading)

    # Skills first
    for keyword in SECTION_KEYWORDS["skills"]:

        if keyword in normalized:
            return "skills"

    for keyword in SECTION_KEYWORDS["summary"]:

        if keyword in normalized:
            return "summary"

    for keyword in SECTION_KEYWORDS["experience"]:

        if keyword in normalized:
            return "experience"

    for keyword in SECTION_KEYWORDS["projects"]:

        if keyword in normalized:
            return "projects"

    for keyword in SECTION_KEYWORDS["education"]:

        if keyword in normalized:
            return "education"

    for keyword in SECTION_KEYWORDS["certifications"]:

        if keyword in normalized:
            return "certifications"

    for keyword in SECTION_KEYWORDS["achievements"]:

        if keyword in normalized:
            return "achievements"

    for keyword in SECTION_KEYWORDS["research"]:

        if keyword in normalized:
            return "research"

    for keyword in SECTION_KEYWORDS["volunteering"]:

        if keyword in normalized:
            return "volunteering"

    return "other"


def split_into_sections(text: str):
    """
    Split resume into major sections.
    """

    lines = text.splitlines()

    sections = []

    current_heading = "GENERAL"
    current_type = "other"
    current_lines = []

    for line in lines:

        if looks_like_heading(line):

            if current_lines:

                sections.append(
                    {
                        "section": current_heading,
                        "section_type": current_type,
                        "text": "\n".join(
                            current_lines
                        ).strip(),
                    }
                )

            current_heading = line.strip()

            current_type = canonical_section_type(
                line
            )

            current_lines = []

        else:

            current_lines.append(line)

    if current_lines:

        sections.append(
            {
                "section": current_heading,
                "section_type": current_type,
                "text": "\n".join(
                    current_lines
                ).strip(),
            }
        )

    return sections


def looks_like_entry_start(
    line: str,
    section_type: str
) -> bool:
    """
    Detect the beginning of an entry inside
    experience or project sections.
    """

    line = line.strip()

    if not line:
        return False

    # EXPERIENCE
    if section_type == "experience":

        normalized = normalize_line(line)

        for signal in ENTRY_SIGNALS:

            if re.search(
                rf"\b{re.escape(signal)}\b",
                normalized
            ):
                return True

        return False

    # PROJECTS
    if section_type == "projects":

        if (
            len(line) <= 80
            and not line.endswith(
                (".", "!", "?")
            )
        ):

            if line.startswith(
                ("-", "•", "*")
            ):
                return False

            words = line.split()

            if 2 <= len(words) <= 12:

                capitalized_words = sum(
                    1
                    for word in words
                    if word[:1].isupper()
                )

                if capitalized_words >= 2:
                    return True

        return False

    return False


def split_section_into_entries(section: dict):
    """
    Split experience/projects into smaller
    logical entries.

    Handles the case where PDF extraction places
    the final bullet of one job and the next job
    title on the same line.
    """

    section_type = section["section_type"]

    text = section["text"]

    # Sections other than experience/projects
    # remain as one logical entry.
    if section_type not in [
        "experience",
        "projects"
    ]:

        return [
            {
                "entry": None,
                "text": text,
            }
        ]

    lines = text.splitlines()

    entries = []

    current_entry = None
    current_lines = []

    for line in lines:

        line = line.strip()

        if not line:
            continue

        # =====================================================
        # EXPERIENCE
        # =====================================================

        if section_type == "experience":

            normalized = normalize_line(line)

            found_signal = None

            for signal in ENTRY_SIGNALS:

                match = re.search(
                    rf"\b{re.escape(signal)}\b",
                    normalized
                )

                if match:

                    found_signal = match

                    break

            if found_signal:

                position = found_signal.start()

                # PDF extraction may produce:
                #
                # • previous bullet text Data Science Intern
                #
                # We separate the previous text from
                # the new entry.
                if position > 0:

                    possible_entry = line[position:]

                    before_entry = line[:position].strip()

                    before_entry = before_entry.lstrip(
                        "•-* "
                    ).strip()

                    if before_entry:

                        current_lines.append(
                            before_entry
                        )

                    if current_lines:

                        entries.append(
                            {
                                "entry": current_entry,
                                "text": "\n".join(
                                    current_lines
                                ).strip(),
                            }
                        )

                    current_entry = (
                        possible_entry.strip()
                    )

                    current_lines = [
                        current_entry
                    ]

                    continue

                # Normal new experience entry
                if current_lines:

                    entries.append(
                        {
                            "entry": current_entry,
                            "text": "\n".join(
                                current_lines
                            ).strip(),
                        }
                    )

                current_entry = line

                current_lines = [line]

                continue

        # =====================================================
        # PROJECTS
        # =====================================================

        if section_type == "projects":

            if looks_like_entry_start(
                line,
                section_type
            ):

                if current_lines:

                    entries.append(
                        {
                            "entry": current_entry,
                            "text": "\n".join(
                                current_lines
                            ).strip(),
                        }
                    )

                current_entry = line

                current_lines = [line]

                continue

        # Normal content
        current_lines.append(line)

    # Save final entry
    if current_lines:

        entries.append(
            {
                "entry": current_entry,
                "text": "\n".join(
                    current_lines
                ).strip(),
            }
        )

    return entries


def split_by_lines(
    text: str,
    max_size: int = 800
):
    """
    Split text into line-based chunks.
    """

    lines = text.splitlines()

    chunks = []

    current = []

    current_length = 0

    for line in lines:

        line_length = len(line)

        if (
            current
            and current_length + line_length
            > max_size
        ):

            chunks.append(
                "\n".join(current).strip()
            )

            current = []

            current_length = 0

        current.append(line)

        current_length += line_length

    if current:

        chunks.append(
            "\n".join(current).strip()
        )

    return chunks


def split_by_sentences(
    text: str,
    max_size: int = 800
):
    """
    Sentence-based fallback splitter.
    """

    sentences = re.split(
        r"(?<=[.!?])\s+",
        text
    )

    chunks = []

    current = []

    current_length = 0

    for sentence in sentences:

        if not sentence.strip():
            continue

        sentence_length = len(sentence)

        if (
            current
            and current_length + sentence_length
            > max_size
        ):

            chunks.append(
                " ".join(current).strip()
            )

            current = []

            current_length = 0

        current.append(sentence)

        current_length += sentence_length

    if current:

        chunks.append(
            " ".join(current).strip()
        )

    return chunks


def split_by_characters(
    text: str,
    max_size: int = 800
):
    """
    Final fallback for very large text.
    """

    return [
        text[i:i + max_size].strip()
        for i in range(
            0,
            len(text),
            max_size
        )
        if text[i:i + max_size].strip()
    ]


def recursive_split(
    text: str,
    max_size: int = 800
):
    """
    Recursively split oversized text.

    Order:

        lines
        ↓
        sentences
        ↓
        characters
    """

    if len(text) <= max_size:

        return [text.strip()]

    chunks = split_by_lines(
        text,
        max_size
    )

    if all(
        len(chunk) <= max_size
        for chunk in chunks
    ):

        return chunks

    final_chunks = []

    for chunk in chunks:

        if len(chunk) <= max_size:

            final_chunks.append(chunk)

        else:

            sentence_chunks = split_by_sentences(
                chunk,
                max_size
            )

            for sentence_chunk in sentence_chunks:

                if len(sentence_chunk) <= max_size:

                    final_chunks.append(
                        sentence_chunk
                    )

                else:

                    final_chunks.extend(
                        split_by_characters(
                            sentence_chunk,
                            max_size
                        )
                    )

    return final_chunks


def chunk_resume(text: str):
    """
    Main resume chunking pipeline.

    raw text
        ↓
    cleaning
        ↓
    section detection
        ↓
    entry detection
        ↓
    recursive chunking
        ↓
    metadata-rich chunks
    """

    text = clean_text(text)

    sections = split_into_sections(text)

    chunks = []

    chunk_id = 0

    for section in sections:

        entries = split_section_into_entries(
            section
        )

        for entry_data in entries:

            entry_name = entry_data["entry"]

            entry_text = entry_data["text"]

            smaller_chunks = recursive_split(
                entry_text,
                max_size=800
            )

            for chunk_text in smaller_chunks:

                chunks.append(
                    {
                        "chunk_id": chunk_id,
                        "section": section["section"],
                        "section_type": section[
                            "section_type"
                        ],
                        "entry": entry_name,
                        "text": chunk_text,
                        "source": "resume",
                    }
                )

                chunk_id += 1

    return chunks