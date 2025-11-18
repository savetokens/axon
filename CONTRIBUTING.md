# Contributing to AXON

Thank you for your interest in contributing to AXON! We welcome contributions from the community.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/savetokens/axon.git
cd axon

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build packages
pnpm build
```

## 🛠️ Development

### Project Structure

```
axon/
├── packages/
│   ├── core/          # Core encoder/decoder library
│   └── cli/           # Command-line tool
├── examples/          # Example files
└── tests/             # Test files
```

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test your changes**
   ```bash
   pnpm test              # Run all tests
   pnpm test:coverage     # Check coverage
   pnpm build             # Verify builds
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature
   ```

## ✅ Code Quality

### Testing Requirements
- All new features must have tests
- Maintain >90% code coverage
- All tests must pass

### Code Style
- TypeScript strict mode
- Prettier formatting
- ESLint passing
- Meaningful variable names

### Commit Messages

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvement

## 🎯 Areas for Contribution

### High Priority
- 🐍 Python implementation
- 📚 Documentation improvements
- 🧪 More test cases
- 🐛 Bug fixes

### Medium Priority
- 🎨 VS Code extension
- ⚡ Performance optimizations
- 📊 Benchmark suite
- 🌐 Integration guides (LangChain, LlamaIndex)

### Nice to Have
- 🦀 Rust port
- 🐹 Go port
- 📱 React Native support
- 🌍 Internationalization

## 📝 Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Update documentation
6. Submit pull request

### PR Checklist

- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code follows style guide
- [ ] Commit messages follow convention
- [ ] No breaking changes (or clearly marked)

## 🐛 Reporting Issues

### Bug Reports

Include:
- AXON version
- Node.js version
- Example code that reproduces the issue
- Expected vs actual behavior

### Feature Requests

Include:
- Use case description
- Expected benefit
- Example usage
- Alternative solutions considered

## 💬 Getting Help

- 💡 Check [existing issues](https://github.com/savetokens/axon/issues)
- 💬 Start a [discussion](https://github.com/savetokens/axon/discussions)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- No harassment or discrimination

## 🎉 Recognition

Contributors will be:
- Listed in release notes
- Credited in documentation
- Mentioned in announcements

Thank you for making AXON better! 🙏
