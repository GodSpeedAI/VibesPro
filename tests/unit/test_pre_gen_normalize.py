
from hooks.pre_gen import is_valid_identifier, normalize_identifier


def test_normalize_basic():
    assert normalize_identifier('My-Project') == 'my_project'
    assert normalize_identifier('123project') == 'a_123project'
    assert normalize_identifier('') == ''


def test_is_valid_identifier():
    assert is_valid_identifier('abc')
    assert is_valid_identifier('a1_b2')
    assert not is_valid_identifier('1abc')
    assert not is_valid_identifier('Abc')
    assert not is_valid_identifier('a-b')
