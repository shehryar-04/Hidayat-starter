import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useRole } from './RoleProvider'

/*
 * Fetches and manages the current user's profile data.
 * Includes avatar public URL from the "profile-images" storage bucket.
 */
export function useProfile() {
  const { userId, role } = useRole()
  const [profile, setProfile] = useState(null)
  const [scholarData, setScholarData] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    try {
      // Fetch base profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, role, full_name, first_name, last_name, avatar_url')
        .eq('id', userId)
        .single()

      setProfile(prof)

      // Resolve avatar URL from storage if not already a full URL
      if (prof?.avatar_url) {
        setAvatarUrl(prof.avatar_url)
      } else {
        // Try to get a public URL for the file named after the user id
        const { data } = supabase.storage
          .from('profile-images')
          .getPublicUrl(userId)
        // Only use it if the file actually exists — we'll verify on load error in the img tag
        setAvatarUrl(data?.publicUrl ?? null)
      }

      // Fetch scholar-specific data if applicable
      if (role === 'scholar' || role === 'mufti') {
        const { data: scholar } = await supabase
          .from('scholars')
          .select('id, title, bio, qualifications, specializations')
          .eq('profile_id', userId)
          .single()
        setScholarData(scholar)
      }
    } catch (err) {
      console.error('useProfile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, role])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  /**
   * Upload a profile image to the "profile-images" bucket.
   * File is named after the user's id so it overwrites any previous image.
   */
  const uploadAvatar = async (file) => {
    if (!userId || !file) return null
    const ext = file.name.split('.').pop()
    const filePath = `${userId}`   // filename = user id, no extension needed (or keep ext)
    const filePathWithExt = `${userId}.${ext}`

    const { error } = await supabase.storage
      .from('profile-images')
      .upload(filePathWithExt, file, { upsert: true, contentType: file.type })

    if (error) throw error

    const { data } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePathWithExt)

    const publicUrl = data.publicUrl

    // Persist the URL on the profile row — user updates their own row
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
    setAvatarUrl(publicUrl)
    return publicUrl
  }

  /**
   * Save student profile fields (first_name, last_name).
   */
  const saveStudentProfile = async ({ firstName, lastName }) => {
    if (!userId) return
    const full_name = `${firstName} ${lastName}`.trim()
    await supabase.from('profiles').update({ first_name: firstName, last_name: lastName, full_name }).eq('id', userId)
    setProfile(p => ({ ...p, first_name: firstName, last_name: lastName, full_name }))
  }

  /**
   * Save scholar profile fields.
   */
  const saveScholarProfile = async ({ firstName, lastName, title, bio, qualifications, specializations }) => {
    if (!userId) return
    const full_name = `${firstName} ${lastName}`.trim()
    await supabase.from('profiles').update({ first_name: firstName, last_name: lastName, full_name }).eq('id', userId)
    setProfile(p => ({ ...p, first_name: firstName, last_name: lastName, full_name }))

    if (scholarData?.id) {
      await supabase.from('scholars').update({ title, bio, qualifications, specializations }).eq('id', scholarData.id)
      setScholarData(s => ({ ...s, title, bio, qualifications, specializations }))
    }
  }

  return { profile, scholarData, avatarUrl, loading, uploadAvatar, saveStudentProfile, saveScholarProfile, refetch: fetchProfile }
}
