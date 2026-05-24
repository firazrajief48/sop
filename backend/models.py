from sqlalchemy import Column, String, Integer, Date, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func
from database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="staf")
    department = Column(String)
    phone = Column(String)
    avatar_url = Column(String)
    is_active = Column(Boolean, default=True)
    join_date = Column(Date, default=func.current_date())
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=func.now())


# ✅ UBAH __tablename__ dari "sops" jadi "sop_documents"
class SOPDocument(Base):
    __tablename__ = "sop_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    department = Column(String, nullable=False)
    responsible_person = Column(String, nullable=False)
    
    # ✅ TAMBAH FIELD INI
    status = Column(String, nullable=False, default="draft")  # draft, active, archived
    approval_status = Column(String, nullable=False, default="pending")  # pending, approved, rejected
    
    effective_date = Column(Date, nullable=False)
    expiry_date = Column(Date)
    version = Column(Integer, default=1)
    file_url = Column(Text)
    created_by = Column(String, nullable=False)
    approved_by = Column(String)
    updated_by = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Field COP
    tanggal_pembuatan = Column(Date)
    tanggal_revisi = Column(Date)
    tanggal_efektif = Column(Date)
    dasar_hukum = Column(Text)
    kualifikasi_pelaksana = Column(Text)
    keterkaitan = Column(Text)
    peralatan_perlengkapan = Column(Text)
    peringatan = Column(Text)
    pencatatan_pendataan = Column(Text)
    maksud = Column(Text)
    tujuan = Column(Text)
    flowchart_steps = Column(JSON)
    pelaksana_columns = Column(JSON)

# ✅ MODEL BARU: SOP Revision
class SOPRevision(Base):
    __tablename__ = "sop_revisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sop_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    version = Column(Integer, nullable=False)
    changes_description = Column(Text, nullable=False)
    revision_type = Column(String, nullable=False, default="update")  # ✅ TAMBAH: create, update, delete
    status = Column(String, nullable=False, default="menunggu_persetujuan")
    revised_by = Column(String, nullable=False)
    reviewed_by = Column(String)
    revision_date = Column(DateTime, default=func.now())
    approval_date = Column(DateTime)
    review_notes = Column(Text)
    
    # ✅ TAMBAH: Simpan data perubahan
    old_data = Column(JSON)  # Data sebelum edit
    new_data = Column(JSON)  # Data setelah edit
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    sop_id = Column(String)
    action = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=func.now())